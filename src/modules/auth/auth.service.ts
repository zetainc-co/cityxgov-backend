import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { LoginDto } from 'src/types/auth.type';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
// import { EmailService } from 'src/config/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    // private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    // Buscar usuario por email
    const { data: user, error } = await this.supabaseService.client
      .from('users_profile')
      .select('*')
      .eq('email', email)
      .single();

    console.log('user', user);

    if (error || !user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const token = jwt.sign(
      { id: user.identification, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' },
    );

    await this.supabaseService.client
      .from('users_profile')
      .update({ token })
      .eq('email', user.email);

    return {
      status: true,
      message: 'Login exitoso',
      data: {
        user: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          identification: user.identification,
          phone: user.phone,
        },
        token,
      },
    };
  }

  async logout(userId: number): Promise<{ message: string }> {
    const { error } = await this.supabaseService.client
      .from('users_profile')
      .update({ token: null })
      .eq('identification', userId);

    if (error) {
      throw new UnauthorizedException('Error al cerrar sesión');
    }

    return {
      message: 'Sesión cerrada correctamente',
    };
  }

  async passwordRecovery(email: string): Promise<{ message: string }> {
    const { data, error } = await this.supabaseService.client
      .from('users_profile')
      .select('identification, email, first_name, last_name')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new BadRequestException('Correo electrónico no encontrado');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpired = new Date();
    otpExpired.setMinutes(otpExpired.getMinutes() + 5);

    // Actualizar en la base de datos
    const { error: updateError } = await this.supabaseService.client
      .from('users_profile')
      .update({
        otp: otp,
        otp_expired: otpExpired.toISOString(),
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      throw new BadRequestException(
        'Error al generar el código de recuperación',
      );
    }

    // Enviar correo con el código OTP
    // await this.emailService.sendPasswordRecoveryEmail(email, otp);

    return {
      message: 'Se ha enviado un código de verificación a tu correo',
    };
  }

  async validateOtp(email: string, otp: string) {
    const { data: user, error } = await this.supabaseService.client
      .from('users_profile')
      .select('identification, email, role, otp, otp_expired')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new BadRequestException('Correo electrónico no encontrado');
    }

    const now = new Date();
    const expiration = new Date(user.otp_expired);

    if (now > expiration) {
      throw new BadRequestException(
        'El código ha expirado, por favor solicite un nuevo código',
      );
    }

    if (user.otp !== otp) {
      throw new BadRequestException(
        'El código no es válido, por favor ingrese un código válido',
      );
    }

    const { error: updateError } = await this.supabaseService.client
      .from('users_profile')
      .update({
        otp: null,
        otp_expired: null,
      })
      .eq('email', email);

    if (updateError) {
      throw new BadRequestException('Error al validar el código');
    }

    const resetToken = jwt.sign(
      {
        id: user.identification,
        email: user.email,
        role: user.role,
        type: 'password_reset',
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '2m' },
    );

    return {
      message: 'Código validado correctamente',
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      if (!token) {
        throw new UnauthorizedException({
          status: false,
          message: 'Token no proporcionado',
          error: 'TOKEN_MISSING',
          statusCode: 401,
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
            error: 'TOKEN_EXPIRED',
            statusCode: 401,
          });
        }
        if (error instanceof jwt.JsonWebTokenError) {
          if (error.message === 'jwt malformed') {
            throw new UnauthorizedException({
              status: false,
              message: 'Formato de token inválido',
              error: 'TOKEN_MALFORMED',
              statusCode: 401,
            });
          }
          if (error.message === 'invalid signature') {
            throw new UnauthorizedException({
              status: false,
              message: 'Token no válido',
              error: 'INVALID_SIGNATURE',
              statusCode: 401,
            });
          }
        }
        throw new UnauthorizedException({
          status: false,
          message: 'Token inválido',
          error: 'INVALID_TOKEN',
          statusCode: 401,
        });
      }

      if (decoded.type !== 'password_reset') {
        throw new UnauthorizedException({
          status: false,
          message: 'Token no válido para cambio de contraseña',
          error: 'INVALID_TOKEN_TYPE',
          statusCode: 401,
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { data: user, error } = await this.supabaseService.client
        .from('users_profile')
        .update({
          password: hashedPassword,
          token: null,
        })
        .eq('identification', decoded.id)
        .select('email, first_name, last_name')
        .single();

      if (error) {
        throw new BadRequestException({
          status: false,
          message: 'Error al actualizar la contraseña',
          error: 'UPDATE_ERROR',
          statusCode: 400,
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
        statusCode: 200,
      };
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new InternalServerErrorException({
        status: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  }

  async changePassword(userId: number, newPassword: string) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await this.supabaseService.client
        .from('users_profile')
        .update({ password: hashedPassword })
        .eq('identification', userId);

      if (updateError) {
        throw new BadRequestException({
          status: false,
          message: 'Error al actualizar la contraseña',
          error: 'UPDATE_ERROR',
          statusCode: 400,
        });
      }

      return {
        status: true,
        message: 'Contraseña actualizada correctamente',
        statusCode: 200,
      };
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new InternalServerErrorException({
        status: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
