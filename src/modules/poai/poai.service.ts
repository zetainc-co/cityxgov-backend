import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  PoaiRequest,
  PoaiUpdateRequest,
  PoaiResponse,
  PoaiCompleto,
  PoaiCompletoData,
} from './dto/poai.dto';
import { SupabaseService } from '../../config/supabase/supabase.service';

@Injectable()
export class PoaiService {
  constructor(private supabaseService: SupabaseService) { }

  // Obtiene todos los POAIs completos
  async findAll(): Promise<PoaiResponse> {
    try {
      // Obtener todos los POAIs con relaciones básicas
      const { data: poais, error } = await this.supabaseService.clientAdmin
        .from('poai')
        .select(`
          *,
          entidad_territorial:entidad_territorial_id(id, nombre_entidad, nombre_municipio, departamento),
          created_by_user:created_by(id, nombre, apellido)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener POAIs: ' + error.message,
        );
      }

      // Para cada POAI, obtener datos relacionados
      const poaisCompletos: PoaiCompletoData[] = [];
      for (const poai of poais || []) {
        const poaiCompleto = await this.getPoaiCompletoData(poai);
        poaisCompletos.push(poaiCompleto);
      }

      return {
        status: true,
        message: 'POAIs encontrados correctamente',
        data: poaisCompletos,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener POAIs',
        error: error.message,
      };
    }
  }

  // Obtiene un POAI completo por ID
  async findOne(id: number): Promise<PoaiResponse> {
    try {
      const { data, error } = await this.supabaseService.clientAdmin
        .from('poai')
        .select(`
          *,
          entidad_territorial:entidad_territorial_id(id, nombre_entidad, nombre_municipio, departamento),
          created_by_user:created_by(id, nombre, apellido)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener POAI: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe un POAI con el ID ${id}`,
          error: 'ID no encontrado',
        };
      }

      // Obtener datos completos del POAI
      const poaiCompleto = await this.getPoaiCompletoData(data);

      return {
        status: true,
        message: 'POAI encontrado correctamente',
        data: poaiCompleto,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener POAI',
        error: error.message,
      };
    }
  }

  // Crear POAI
  async create(createRequest: PoaiRequest, userId?: number) {
    try {
      // Buscar el usuario real por identificación si userId es una identificación
      let realUserId = userId;
      if (userId && userId.toString().length > 8) {
        // Si es muy largo, probablemente es una identificación, buscar el usuario real
        const { data: user, error: userError } = await this.supabaseService.clientAdmin
          .from('usuarios')
          .select('id')
          .eq('identificacion', userId.toString())
          .single();

        if (userError) {
          realUserId = undefined; // Usar undefined si no se encuentra
        } else {
          realUserId = user.id;
        }
      }

      const { data: poai, error } = await this.supabaseService.clientAdmin
        .from('poai')
        .insert({
          año: createRequest.año,
          entidad_territorial_id: createRequest.entidad_territorial_id,
          created_by: realUserId
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error al crear POAI: ${error.message}`);
      }

      return poai;
    } catch (error) {
      throw new Error(`Error al crear POAI: ${error.message}`);
    }
  }

  // Actualiza un POAI
  async update(id: number, updateRequest: PoaiUpdateRequest): Promise<PoaiResponse> {
    try {
      // Verificar si el POAI existe
      const { data: existingPoai } = await this.supabaseService.clientAdmin
        .from('poai')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (!existingPoai) {
          return {
            status: false,
          message: `No existe un POAI con el ID ${id}`,
          error: 'ID no encontrado',
        };
      }

      // Preparar datos de actualización
      const updateData: any = {
        ...updateRequest,
        updated_at: new Date().toISOString()
      };

      // Actualizar el POAI
      const { data: poai, error: poaiError } = await this.supabaseService.clientAdmin
        .from('poai')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (poaiError) {
        throw new InternalServerErrorException(
          'Error al actualizar POAI: ' + poaiError.message,
        );
      }

      return {
        status: true,
        message: 'POAI actualizado correctamente',
        data: poai,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al actualizar POAI',
        error: error.message,
      };
    }
  }

  // Elimina un POAI
  async delete(id: number): Promise<PoaiResponse> {
    try {
      // Verificar si el POAI existe
      const { data: existingPoai } = await this.supabaseService.clientAdmin
        .from('poai')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (!existingPoai) {
        return {
          status: false,
          message: `No existe un POAI con el ID ${id}`,
          error: 'ID no encontrado',
        };
      }

      // Eliminar el POAI (las líneas estratégicas se eliminan en cascada)
      const { error } = await this.supabaseService.clientAdmin
        .from('poai')
        .delete()
        .eq('id', id);

      if (error) {
        throw new InternalServerErrorException(
          'Error al eliminar POAI: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'POAI eliminado correctamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al eliminar POAI',
        error: error.message,
      };
    }
  }

  // Obtiene líneas estratégicas disponibles
  async getLineasEstrategicasDisponibles(): Promise<PoaiResponse> {
    try {
      const { data: lineasEstrategicas, error } = await this.supabaseService.clientAdmin
        .from('linea_estrategica')
        .select('*')
        .order('nombre');

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener líneas estratégicas: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Líneas estratégicas obtenidas correctamente',
        data: lineasEstrategicas,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener líneas estratégicas',
        error: error.message,
      };
    }
  }

  // Método privado para obtener datos completos de un POAI
  private async getPoaiCompletoData(poai: any): Promise<PoaiCompletoData> {
    // Obtener topes presupuestales del año del POAI
    const { data: topesPresupuestales } = await this.supabaseService.clientAdmin
        .from('topes_presupuestales')
      .select('*')
      .eq('año', poai.año);

    // Obtener banco de proyectos del año del POAI
    const { data: bancoProyectos } = await this.supabaseService.clientAdmin
      .from('banco_proyectos')
      .select('*')
      .eq('año', poai.año);

    // Obtener programación financiera solo del año específico
    const { data: programacionFinancieraRaw } = await this.supabaseService.clientAdmin
      .from('programacion_financiera')
      .select(`
        *,
        fuente_financiacion:fuente_id(id, nombre, descripcion)
      `)
      .gt(`periodo_${poai.año}`, 0);

    // Transformar para mostrar solo el período del año del POAI
    const programacionFinanciera = programacionFinancieraRaw?.map(item => ({
      id: item.id,
      meta_id: item.meta_id,
      fuente_id: item.fuente_id,
      fuente_financiacion: item.fuente_financiacion,
      [`periodo_${poai.año}`]: item[`periodo_${poai.año}`],
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];

    // Obtener programación física solo del año específico
    const { data: programacionFisicaRaw } = await this.supabaseService.clientAdmin
      .from('programacion_fisica')
      .select('*')
      .gt(`periodo_${poai.año}`, 0);

    // Transformar para mostrar solo el período del año del POAI
    const programacionFisica = programacionFisicaRaw?.map(item => ({
      id: item.id,
      meta_id: item.meta_id,
      [`periodo_${poai.año}`]: item[`periodo_${poai.año}`],
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];

    // Obtener todas las líneas estratégicas disponibles (para el endpoint de líneas disponibles)
    const { data: lineasEstrategicas } = await this.supabaseService.clientAdmin
      .from('linea_estrategica')
      .select('*')
      .order('nombre');

    // Obtener todas las metas de resultado
    const { data: metasResultado } = await this.supabaseService.clientAdmin
      .from('meta_resultado')
      .select('*');

    // Obtener todas las metas de producto
    const { data: metasProducto } = await this.supabaseService.clientAdmin
      .from('meta_producto')
      .select('*');

      return {
      poai: {
        ...poai,
        lineas_estrategicas: lineasEstrategicas || []
      },
      topes_presupuestales: topesPresupuestales || [],
      banco_proyectos: bancoProyectos || [],
      programacion_financiera: programacionFinanciera,
      programacion_fisica: programacionFisica,
      lineas_estrategicas: lineasEstrategicas || [],
      metas_resultado: metasResultado || [],
      metas_producto: metasProducto || []
    };
  }
}
