import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { ProgramaRequest, ProgramaResponse } from './dto/programa.dto';

@Injectable()
export class ProgramaService {
  constructor(private supabaseService: SupabaseService) {}

  //Obtiene todos los programas
  async findAll(): Promise<ProgramaResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programa')
        .select('*');

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener programas: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Programas encontrados',
        data: data,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener programas',
        error: error.message,
        data: [],
      };
    }
  }

  //Obtiene un programa por su id
  async findOne(id: number): Promise<ProgramaResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programa')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al buscar programa: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un programa con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Programa encontrado',
        data: [data],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al buscar programa',
        error: error.message,
        data: [],
      };
    }
  }

  //Crea un programa
  async create(createRequest: ProgramaRequest): Promise<ProgramaResponse> {
    try {
      // 1. Validar que existe la línea estratégica
      const { data: lineaEstrategica, error: lineaError } =
        await this.supabaseService.clientAdmin
          .from('linea_estrategica')
          .select('id')
          .eq('id', createRequest.linea_estrategica_id)
          .maybeSingle();

      if (lineaError) {
        throw new InternalServerErrorException(
          'Error al validar línea estratégica: ' + lineaError.message,
        );
      }

      if (!lineaEstrategica) {
        return {
          status: false,
          message: `No existe una línea estratégica con el ID ${createRequest.linea_estrategica_id}`,
          error: 'Línea estratégica no encontrada',
          data: [],
        };
      }

      // 2. Validar si el programa existe
      const { data: existingPrograma, error: programaError } =
        await this.supabaseService.clientAdmin
          .from('programa')
          .select('id')
          .eq('nombre', createRequest.nombre.trim())
          .maybeSingle();

      if (programaError) {
        throw new InternalServerErrorException(
          'Error al validar nombre de programa: ' + programaError.message,
        );
      }

      if (existingPrograma) {
        return {
          status: false,
          message: 'Ya existe un programa con este nombre',
          error: 'Nombre duplicado',
          data: [],
        };
      }

      // 3. Crear el programa
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programa')
        .insert({
          nombre: createRequest.nombre.trim(),
          descripcion: createRequest.descripcion?.trim() || null,
          linea_estrategica_id: createRequest.linea_estrategica_id,
        })
        .select('*')
        .single();

      if (error) {
        throw new InternalServerErrorException(
          'Error al crear programa: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Programa creado correctamente',
        data: [data],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al crear programa',
        error: error.message,
        data: [],
      };
    }
  }

  //Actualiza un programa
  async update(
    id: number,
    createRequest: ProgramaRequest,
  ): Promise<ProgramaResponse> {
    try {
      // 1. Obtener el programa actual (todos los campos)
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programa')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al verificar programa: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un programa con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      // 2. Validar que existe la línea estratégica
      const { data: lineaEstrategica, error: lineaError } =
        await this.supabaseService.clientAdmin
          .from('linea_estrategica')
          .select('id')
          .eq('id', createRequest.linea_estrategica_id)
          .maybeSingle();

      if (lineaError) {
        throw new InternalServerErrorException(
          'Error al validar línea estratégica: ' + lineaError.message,
        );
      }

      if (!lineaEstrategica) {
        return {
          status: false,
          message: `No existe una línea estratégica con el ID ${createRequest.linea_estrategica_id}`,
          error: 'Línea estratégica no encontrada',
          data: [],
        };
      }

      // 3. Validar si el nombre ya existe en otro programa
      const { data: existingPrograma, error: programaError } =
        await this.supabaseService.clientAdmin
          .from('programa')
          .select('id')
          .eq('nombre', createRequest.nombre.trim())
          .neq('id', id)
          .maybeSingle();

      if (programaError) {
        throw new InternalServerErrorException(
          'Error al validar nombre de programa: ' + programaError.message,
        );
      }

      if (existingPrograma) {
        return {
          status: false,
          message: 'Ya existe un programa con este nombre',
          error: 'Nombre duplicado',
          data: [],
        };
      }

      // 4. Verificar si hay cambios
      if (
        data.nombre === createRequest.nombre.trim() &&
        data.descripcion === createRequest.descripcion?.trim() &&
        data.linea_estrategica_id === createRequest.linea_estrategica_id
      ) {
        return {
          status: false,
          message: 'No se detectaron cambios en el programa',
          error: 'Sin cambios',
          data: [data],
        };
      }

      // 5. Actualizar el programa
      const { data: updatedData, error: updatedError } =
        await this.supabaseService.clientAdmin
          .from('programa')
          .update({
            nombre: createRequest.nombre.trim(),
            descripcion: createRequest.descripcion?.trim() || null,
            linea_estrategica_id: createRequest.linea_estrategica_id,
          })
          .eq('id', id)
          .select('*')
          .single();

      if (updatedError) {
        throw new InternalServerErrorException(
          'Error al actualizar programa: ' + updatedError.message,
        );
      }

      return {
        status: true,
        message: 'Programa actualizado correctamente',
        data: [updatedData],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al actualizar programa',
        error: error.message,
        data: [],
      };
    }
  }

  async delete(id: number): Promise<ProgramaResponse> {
    try {
      // 1. Verificar si el programa existe
      const { data, error } = await this.supabaseService.clientAdmin
        .from('programa')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al verificar programa: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un programa con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }
      // 2. Eliminar el programa
      const { error: deleteError } = await this.supabaseService.clientAdmin
        .from('programa')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new InternalServerErrorException(
          'Error al eliminar programa: ' + deleteError.message,
        );
      }

      return {
        status: true,
        message: `Programa ${data.nombre} ha sido eliminado correctamente`,
        data: [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al eliminar programa',
        error: error.message,
        data: [],
      };
    }
  }
}
