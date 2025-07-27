import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase/supabase.service';
import {
  PoaiVigenciaResponse,
  PoaiVigenciaRequest,
  PoaiDataResponse
} from './dto/poai.dto';

@Injectable()
export class PoaiService {
  constructor(private supabaseService: SupabaseService) {}

  // Obtiene todas las vigencias
  async findAllVigencias(): Promise<PoaiVigenciaResponse> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('poai_vigencias')
        .select('*')
        .order('año', { ascending: false });

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener vigencias: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Vigencias encontradas correctamente',
        data: data,
        error: null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener vigencias',
        error: error.message,
      };
    }
  }

  // Obtiene una vigencia por su ID
  async findVigenciaById(id: number): Promise<PoaiVigenciaResponse> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('poai_vigencias')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener vigencia: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe una vigencia con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Vigencia encontrada correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener vigencia',
        error: error.message,
      };
    }
  }

  // Obtiene una vigencia por año
  async findVigenciaByAño(año: number): Promise<PoaiVigenciaResponse> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('poai_vigencias')
        .select('*')
        .eq('año', año)
        .maybeSingle();

      if (error) {
        throw new InternalServerErrorException(
          'Error al obtener vigencia: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe una vigencia para el año ${año}`,
          error: 'Año no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Vigencia encontrada correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al obtener vigencia',
        error: error.message,
      };
    }
  }

  // Crea una nueva vigencia
  async createVigencia(createRequest: PoaiVigenciaRequest): Promise<PoaiVigenciaResponse> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('poai_vigencias')
        .insert({
          año: createRequest.año,
          descripcion: createRequest.descripcion,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return {
            status: false,
            message: 'Ya existe una vigencia para este año',
            error: 'Vigencia duplicada',
            data: [],
          };
        }
        throw new InternalServerErrorException(
          'Error al crear vigencia: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Vigencia creada correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al crear vigencia',
        error: error.message,
      };
    }
  }

  // Actualiza una vigencia
  async updateVigencia(id: number, updateRequest: PoaiVigenciaRequest): Promise<PoaiVigenciaResponse> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('poai_vigencias')
        .update({
          descripcion: updateRequest.descripcion,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException(
          'Error al actualizar vigencia: ' + error.message,
        );
      }

      if (!data) {
        return {
          status: false,
          message: `No existe una vigencia con el ID ${id}`,
          error: 'ID no encontrado',
          data: [],
        };
      }

      return {
        status: true,
        message: 'Vigencia actualizada correctamente',
        data: data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al actualizar vigencia',
        error: error.message,
      };
    }
  }

  // Elimina una vigencia
  async deleteVigencia(id: number): Promise<PoaiVigenciaResponse> {
    try {
      const { error } = await this.supabaseService.client
        .from('poai_vigencias')
        .delete()
        .eq('id', id);

      if (error) {
        throw new InternalServerErrorException(
          'Error al eliminar vigencia: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Vigencia eliminada correctamente',
        data: [],
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        status: false,
        message: 'Error al eliminar vigencia',
        error: error.message,
      };
    }
  }

  // Obtiene todos los datos del POAI por año
  async getPoaiDataByAño(año: number): Promise<PoaiDataResponse> {
    try {
      // Obtener vigencia
      const vigenciaResponse = await this.findVigenciaByAño(año);
      if (!vigenciaResponse.status) {
        return {
          status: false,
          message: vigenciaResponse.message,
          error: vigenciaResponse.error,
        };
      }

      // Obtener líneas estratégicas
      const { data: lineasEstrategicas } = await this.supabaseService.client
        .from('linea_estrategica')
        .select('*');

      // Obtener metas resultado
      const { data: metasResultado } = await this.supabaseService.client
        .from('meta_resultado')
        .select('*');

      // Obtener metas producto
      const { data: metasProducto } = await this.supabaseService.client
        .from('meta_producto')
        .select('*');

      // Obtener topes presupuestales para el año
      const { data: topesPresupuestales } = await this.supabaseService.client
        .from('topes_presupuestales')
        .select(`
          *,
          fuentes_financiacion(*)
        `)
        .eq('año', año);

      // Obtener banco de proyectos
      const { data: bancoProyectos } = await this.supabaseService.client
        .from('banco_proyectos')
        .select('*');

      // Obtener programación financiera
      const { data: programacionFinanciera } = await this.supabaseService.client
        .from('programacion_financiera')
        .select(`
          *,
          meta_producto(*),
          fuentes_financiacion(*)
        `);

      // Obtener programación física
      const { data: programacionFisica } = await this.supabaseService.client
        .from('programacion_fisica')
        .select(`
          *,
          meta_producto(*)
        `);

      return {
        status: true,
        message: 'Datos del POAI obtenidos correctamente',
        data: {
          vigencia: vigenciaResponse.data as any,
          lineas_estrategicas: lineasEstrategicas || [],
          metas_resultado: metasResultado || [],
          metas_producto: metasProducto || [],
          topes_presupuestales: topesPresupuestales || [],
          banco_proyectos: bancoProyectos || [],
          programacion_financiera: programacionFinanciera || [],
          programacion_fisica: programacionFisica || []
        },
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al obtener datos del POAI',
        error: error.message,
      };
    }
  }

  // Actualiza programación financiera
  async updateProgramacionFinanciera(metaId: number, fuenteId: number, año: number, valor: number) {
    try {
      const campoPeriodo = `periodo_${año}`;

      const { data, error } = await this.supabaseService.client
        .from('programacion_financiera')
        .update({ [campoPeriodo]: valor })
        .eq('meta_id', metaId)
        .eq('fuente_id', fuenteId)
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException(
          'Error al actualizar programación financiera: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Programación financiera actualizada correctamente',
        data: data,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al actualizar programación financiera',
        error: error.message,
      };
    }
  }

  // Actualiza programación física
  async updateProgramacionFisica(metaId: number, año: number, valor: number) {
    try {
      const campoPeriodo = `periodo_${año}`;

      const { data, error } = await this.supabaseService.client
        .from('programacion_fisica')
        .update({ [campoPeriodo]: valor })
        .eq('meta_id', metaId)
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException(
          'Error al actualizar programación física: ' + error.message,
        );
      }

      return {
        status: true,
        message: 'Programación física actualizada correctamente',
        data: data,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al actualizar programación física',
        error: error.message,
      };
    }
  }

  // Valida topes presupuestales
  async validateTopesPresupuestales(año: number, fuenteId: number, valor: number) {
    try {
      const { data: tope } = await this.supabaseService.client
        .from('topes_presupuestales')
        .select('tope_maximo')
        .eq('año', año)
        .eq('fuente_id', fuenteId)
        .single();

      if (tope && valor > tope.tope_maximo) {
        return {
          status: false,
          message: `El valor excede el tope presupuestal de ${tope.tope_maximo}`,
          error: 'Tope excedido',
        };
      }

      return {
        status: true,
        message: 'Tope válido',
        data: true,
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al validar topes',
        error: error.message,
      };
    }
  }
}
