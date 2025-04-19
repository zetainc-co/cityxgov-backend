import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const supabaseRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICES_ROLE',
    );

    if (!supabaseUrl) {
      throw new Error(
        'SUPABASE_URL no está definido en las variables de entorno',
      );
    }

    if (!supabaseKey) {
      throw new Error(
        'SUPABASE_KEY no está definido en las variables de entorno',
      );
    }

    if (!supabaseRoleKey) {
      throw new Error(
        'SUPABASE_SERVICES_ROLE no está definido en las variables de entorno',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.supabaseAdmin = createClient(supabaseUrl, supabaseRoleKey);
  }

  get client() {
    return this.supabase;
  }

  get clientAdmin() {
    return this.supabaseAdmin;
  }

  async testConnection() {
    try {
      const { count, error } = await this.supabase
        .from('user')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return {
          status: 'error',
          message: error.message,
          details: error,
        };
      }

      return {
        status: 'success',
        message: 'Conexión exitosa con Supabase',
        details: {
          timestamp: new Date().toISOString(),
          totalUsers: count,
          tableAccessed: 'users',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Error al conectar con Supabase',
        details: error,
      };
    }
  }
}
