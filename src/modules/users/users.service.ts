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
      throw new NotFoundException({
        status: false,
        message: `Usuario con identificación ${identification} no encontrado`,
        data: [],
      });
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
            data: [],
          });
        }
        throw new ConflictException({
          status: false,
          message: res.error,
          data: [],
        });
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
            throw new ConflictException({
              status: false,
              message: 'El número de teléfono ya está registrado',
              data: [],
            });
          } else if (userProfileError.message.includes('email')) {
            throw new ConflictException({
              status: false,
              message: 'El correo electrónico ya está registrado',
              data: [],
            });
          } else if (
            userProfileError.message.includes('identification') ||
            userProfileError.details?.includes('identification')
          ) {
            throw new ConflictException({
              status: false,
              message: 'El número de identificación ya está registrado',
              data: [],
            });
          }
        }
        throw new ConflictException({
          status: false,
          message: userProfileError,
          data: [],
        });
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
    updateUserRequest: UpdateUserRequest,
    user: any,
  ): Promise<CreateUserResponse> {
    const userToUpdate = await this.findOne(user.userId);

    if (!userToUpdate) {
      throw new NotFoundException({
        status: false,
        message: `Usuario con identificación ${user.userId} no encontrado`,
        data: [],
      });
    }

    if (
      updateUserRequest.user?.roles &&
      !userToUpdate.roles?.includes('superadmin')
    ) {
      throw new ConflictException({
        status: false,
        message: 'No tienes permisos para modificar roles de otros usuarios',
        data: [],
      });
    }

    if (updateUserRequest.user?.roles?.includes('superadmin')) {
      throw new ConflictException({
        status: false,
        message: 'No se puede asignar el rol de superadmin',
        data: [],
      });
    }

    const updateData = { ...updateUserRequest.user };

    const { data, error } = await this.supabaseService.clientAdmin
      .from('profile')
      .update(updateData)
      .eq('identification', user.userId)
      .select(
        'identification, first_name, last_name, phone, email, roles, avatar, is_active',
      )
      .single();

    if (error) throw new ConflictException(error);

    return {
      status: true,
      message: `Perfil actualizado correctamente`,
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
