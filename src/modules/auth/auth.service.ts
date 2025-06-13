import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { LoginDto } from 'src/modules/auth/types/auth.type';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
// import { EmailService } from 'src/config/email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private supabaseService: SupabaseService,
        // private emailService: EmailService,
    ) { }

    async validateUser(correo: string, contrasena: string) {
        // Buscar usuario por correo
        const { data: user, error } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .select('*')
            .eq('correo', correo)
            .single();

        if (error || !user) {
            throw new UnauthorizedException({
                status: false,
                message: 'No existe un usuario con el correo electrónico proporcionado',
                data: [],
            });
        }

        if (!user.activo) {
            throw new UnauthorizedException({
                status: false,
                message: 'Su cuenta se encuentra inactiva, por favor contacte al administrador',
                data: [],
            });
        }
        const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena);

        if (!isPasswordValid) {
            throw new UnauthorizedException({
                status: false,
                message: 'Credenciales incorrectas',
                data: [],
            });
        }

        const { contrasena: _, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.correo, loginDto.contrasena);

        // Obtener roles desde usuario_area
        const { data: rolesData, error: rolesError } = await this.supabaseService.clientAdmin
            .from('usuario_area')
            .select('rol:rol_id(nombre)')
            .eq('usuario_id', user.id);

        if (rolesError) {
            throw new InternalServerErrorException({
                status: false,
                message: 'Error al obtener roles del usuario',
                data: [],
            });
        }

        const roles = rolesData ? rolesData.map((ua: any) => ua.rol?.nombre).filter(Boolean) : [];
        const token = jwt.sign(
            { id: user.identificacion, roles },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' },
        );

        await this.supabaseService.clientAdmin
            .from('usuarios')
            .update({ token })
            .eq('correo', user.correo);

        return {
            status: true,
            message: 'Login exitoso',
            data: {
                user: {
                    email: user.correo,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    identificacion: user.identificacion,
                    telefono: user.telefono,
                    roles,
                    avatar: user.avatar,
                },
                token,
            },
        };
    }

    async logout(identificacion: number) {
        const { error } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .update({ token: null })
            .eq('identificacion', identificacion);

        if (error) {
            throw new UnauthorizedException({
                status: false,
                message: 'Error al cerrar sesión',
                data: [],
            });
        }

        return {
            status: true,
            message: 'Sesión cerrada correctamente',
            data: [],
        };
    }

    async passwordRecovery(correo: string) {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .select('identificacion, correo, nombre, apellido')
            .eq('correo', correo)
            .single();

        if (error || !data) {
            throw new BadRequestException({
                status: false,
                message: 'Correo electrónico no encontrado',
                data: [],
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpExpired = new Date();
        otpExpired.setMinutes(otpExpired.getMinutes() + 5);

        // Actualizar en la base de datos
        const { error: updateError } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .update({
                otp: otp,
                otp_expired: otpExpired.toISOString(),
            })
            .eq('correo', correo)
            .select()
            .single();

        if (updateError) {
            throw new BadRequestException({
                status: false,
                message: 'Error al generar el código de recuperación',
                data: [],
            });
        }

        // Enviar correo con el código OTP
        // await this.emailService.sendPasswordRecoveryEmail(email, otp);

        return {
            status: true,
            message: 'Se ha enviado un código de verificación a tu correo',
            data: [],
        };
    }

    async validateOtp(correo: string, otp: string) {
        const { data: user, error } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .select('identificacion, correo, roles, otp, otp_expired')
            .eq('correo', correo)
            .single();

        if (error || !user) {
            throw new BadRequestException({
                status: false,
                message: 'Correo electrónico no encontrado',
                data: [],
            });
        }

        const now = new Date();
        const expiration = new Date(user.otp_expired);

        if (now > expiration) {
            throw new BadRequestException({
                status: false,
                message: 'El código ha expirado, por favor solicite un nuevo código',
                data: [],
            });
        }

        if (user.otp !== otp) {
            throw new BadRequestException({
                status: false,
                message: 'El código no es válido, por favor ingrese un código válido',
                data: [],
            });
        }

        const { error: updateError } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .update({
                otp: null,
                otp_expired: null,
            })
            .eq('correo', correo);

        if (updateError) {
            throw new BadRequestException({
                status: false,
                message: 'Error al validar el código',
                data: [],
            });
        }

        const resetToken = jwt.sign(
            {
                id: user.identificacion,
                correo: user.correo,
                roles: user.roles,
                type: 'password_reset',
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '2m' },
        );

        return {
            status: true,
            message: 'Código validado correctamente',
            data: {
                resetToken,
            },
        };
    }

    async resetPassword(token: string, newPassword: string) {
        try {
            if (!token) {
                throw new UnauthorizedException({
                    status: false,
                    message: 'Token no proporcionado',
                    data: [],
                });
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    throw new UnauthorizedException({
                        status: false,
                        message: 'El token ha expirado, solicite uno nuevo',
                        data: [],
                    });
                }
                if (error instanceof jwt.JsonWebTokenError) {
                    if (error.message === 'jwt malformed') {
                        throw new UnauthorizedException({
                            status: false,
                            message: 'Formato de token inválido',
                            data: [],
                        });
                    }
                    if (error.message === 'invalid signature') {
                        throw new UnauthorizedException({
                            status: false,
                            message: 'Token no válido',
                            data: [],
                        });
                    }
                }
                throw new UnauthorizedException({
                    status: false,
                    message: 'Token inválido',
                    data: [],
                });
            }

            if (decoded.type !== 'password_reset') {
                throw new UnauthorizedException({
                    status: false,
                    message: 'Token no válido para cambio de contraseña',
                    data: [],
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const { data: user, error } = await this.supabaseService.clientAdmin
                .from('usuarios')
                .update({
                    contrasena: hashedPassword,
                    token: null,
                })
                .eq('identificacion', decoded.id)
                .select('correo, nombre, apellido')
                .single();

            if (error) {
                throw new BadRequestException({
                    status: false,
                    message: 'Error al actualizar la contraseña',
                    data: [],
                });
            }

            // Enviar correo de confirmación de cambio de contraseña
            // await this.emailService.sendPasswordChangedEmail({
            //   firstName: user.first_name,
            //   lastName: user.last_name,
            //   email: user.email,
            // });

            return {
                status: true,
                message: 'Contraseña actualizada correctamente',
                data: [],
            };
        } catch (error) {
            if (error.response) {
                throw error;
            }
            throw new InternalServerErrorException({
                status: false,
                message: 'Error interno del servidor',
                data: [],
            });
        }
    }

    async changePassword(identificacion: number, newPassword: string) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error } = await this.supabaseService.clientAdmin
            .from('usuarios')
            .update({ contrasena: hashedPassword })
            .eq('identificacion', identificacion);

        if (error) {
            throw new InternalServerErrorException({
                status: false,
                message: 'Error al cambiar la contraseña',
                data: [],
            });
        }

        return {
            status: true,
            message: 'Contraseña cambiada correctamente',
            data: [],
        };
    }
}
