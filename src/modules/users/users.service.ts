import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  User,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
} from 'src/types/user.type';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll() {
    const { data, error, count, status, statusText } =
      await this.supabaseService.clientAdmin
        .from('profile')
        .select(
          'identification, first_name, last_name, phone, email, roles, avatar, token, is_active, created_at',
        )
        .order('created_at', { ascending: false });

    if (error) throw error;
    const response = {
      status: status,
      message: 'Usuarios encontrados correctamente',
      data: data,
      count: count,
      statusText: statusText,
      error: error,
    };
    return response;
  }

  async findOne(identification: number): Promise<Omit<User, 'password'>> {
    const { data, error } = await this.supabaseService.clientAdmin
      .from('profile')
      .select(
        'identification, first_name, last_name, phone, email, roles, avatar, token, is_active, created_at',
      )
      .eq('identification', identification)
      .single();

    if (!data) {
      throw new NotFoundException(
        `Usuario con identificación ${identification} no encontrado`,
      );
    }

    if (error) throw error;
    return data;
  }

  async create(createRequest: CreateUserRequest): Promise<CreateUserResponse> {
    const { user } = createRequest;

    try {
      const hashedPassword = await bcrypt.hash(
        user.identification.toString(),
        10,
      );

      const res = await this.supabaseService.clientAdmin.auth.admin.createUser({
        email: user.email,
        password: user.identification.toString(),
        email_confirm: true,
        user_metadata: {
          identification: user.identification,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          avatar: user.avatar,
          roles: user.roles,
        },
      });
      

      const user_profile = {
        identification: res.data.user?.user_metadata.identification,
        first_name: res.data.user?.user_metadata.first_name,
        last_name: res.data.user?.user_metadata.last_name,
        phone: res.data.user?.user_metadata.phone,
        email: res.data.user?.email,
        avatar: res.data.user?.user_metadata.avatar,
        roles: res.data.user?.user_metadata.roles,
        password: hashedPassword,
        user_id: res.data.user?.id,
        is_active: true,
      };

      if (res.error) {
        if (res.error.code === 'email_exists') {
          throw new ConflictException({
            status: false,
            message: 'El correo electrónico ya está registrado en el sistema.',
            error: 'EMAIL_EXISTS',
            statusCode: 422,
          });
        }
        throw new ConflictException(res.error);
      }

      const { data: userData, error: userProfileError } =
        await this.supabaseService.clientAdmin
          .from('profile')
          .insert([user_profile])
          .select()
          .single();

      if (userProfileError) {
        if (userProfileError.code === '23505') {
          if (userProfileError.message.includes('phone')) {
            throw new ConflictException(
              'El número de teléfono ya está registrado',
            );
          } else if (userProfileError.message.includes('email')) {
            throw new ConflictException(
              'El correo electrónico ya está registrado',
            );
          } else if (
            userProfileError.message.includes('identification') ||
            userProfileError.details?.includes('identification')
          ) {
            throw new ConflictException(
              'El número de identificación ya está registrado',
            );
          }
        }
        throw new ConflictException(userProfileError);
      }

      return {
        status: true,
        message: 'Usuario registrado correctamente',
        data: [
          {
            identification: userData.identification,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            email: userData.email,
            roles: userData.roles,
            avatar: userData.avatar,
            is_active: userData.is_active,
          },
        ],
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async updateUser(
    identification: number,
    updateUserRequest: UpdateUserRequest,
    user: any,
  ): Promise<CreateUserResponse> {
    

    const userToUpdate = await this.findOne(identification);

    if (!userToUpdate) {
      throw new NotFoundException(
        `Usuario con identificación ${identification} no encontrado`,
      );
    }

    const isSelfUpdate = user.userId === identification;

    if (!isSelfUpdate && !user.roles?.some(role => ['admin', 'superadmin'].includes(role))) {
      throw new ConflictException(
        'No tienes permisos para actualizar perfiles de otros usuarios',
      );
    }

    if (updateUserRequest.user.roles && !isSelfUpdate) {
      if (!user.roles?.includes('superadmin')) {
        throw new ConflictException(
          'No tienes permisos para modificar roles de otros usuarios',
        );
      }

      if (userToUpdate.roles.includes('superadmin')) {
        throw new ConflictException(
          'No se puede cambiar el rol de un superadmin',
        );
      }

      if (updateUserRequest.user.roles.includes('superadmin')) {
        throw new ConflictException('No se puede asignar el rol de superadmin');
      }
    }

    const updateData: any = {};
    
    if (updateUserRequest.user.first_name) updateData.first_name = updateUserRequest.user.first_name;
    if (updateUserRequest.user.last_name) updateData.last_name = updateUserRequest.user.last_name;
    if (updateUserRequest.user.phone) updateData.phone = updateUserRequest.user.phone;
    if (updateUserRequest.user.avatar) updateData.avatar = updateUserRequest.user.avatar;
    
    if (updateUserRequest.user.roles && !isSelfUpdate && user.roles?.includes('superadmin')) {
      updateData.roles = updateUserRequest.user.roles;
    }

    const { data, error } = await this.supabaseService.clientAdmin
      .from('profile')
      .update(updateData)
      .eq('identification', identification)
      .select(
        'identification, first_name, last_name, phone, email, roles, avatar, is_active',
      )
      .single();

    if (error) throw new ConflictException(error);

    return {
      status: true,
      message: `Perfil del usuario ${data.first_name} ${data.last_name} actualizado correctamente`,
      data: [data],
    };
  }

  async updateUserStatus(identification: number): Promise<CreateUserResponse> {
    const user = await this.findOne(identification);

    if (!user) {
      throw new NotFoundException(
        `Usuario con identificación ${identification} no encontrado`,
      );
    }
    const { data, error } = await this.supabaseService.client
      .from('profile')
      .update({ is_active: !user.is_active })
      .eq('identification', identification)
      .select(
        'identification, first_name, last_name, phone, email, roles, avatar, is_active',
      )
      .single();

    if (error) throw new ConflictException(error);

    return {
      status: true,
      message: `Usuario ${data.is_active ? 'activado' : 'desactivado'} correctamente`,
      data: [data],
    };
  }
}
