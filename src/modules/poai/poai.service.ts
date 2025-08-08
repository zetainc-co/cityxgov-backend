import {
    Injectable,
    InternalServerErrorException,
  } from '@nestjs/common';
  import {
    PoaiResponse,
    PoaiCompletoData,
  } from './dto/poai.dto';
  import { SupabaseService } from '../../config/supabase/supabase.service';

  @Injectable()
  export class PoaiService {
    constructor(private supabaseService: SupabaseService) { }

  //Obtener datos completos del POAI por año
    async getPoaiCompletoByYear(año: number): Promise<PoaiResponse> {
      try {
        // Mapear año a período
        const mapeoPeriodos = {
          2024: 1,
          2025: 2,
          2026: 3,
          2027: 4
        };

        const periodo = mapeoPeriodos[año];

        if (!periodo) {
          return {
            status: false,
            message: `Año ${año} no válido. Solo se permiten años entre 2024-2027`,
            error: 'AÑO_INVALIDO',
          };
        }

        // Verificar si existe POAI para el año
        const { data: poai, error: poaiError } = await this.supabaseService.clientAdmin
          .from('poai')
          .select('*')
          .eq('periodo', periodo)
          .maybeSingle();

        if (poaiError) {
          throw new InternalServerErrorException(
            'Error al obtener POAI: ' + poaiError.message,
          );
        }

        if (!poai) {
          return {
            status: false,
            message: `No existe un POAI para el año ${año} (periodo ${periodo})`,
            error: 'POAI_NO_ENCONTRADO',
          };
        }

        // Obtener toda la información usando JOINs
        const poaiCompleto = await this.getPoaiCompletoWithJoins(poai, periodo);

        return {
          status: true,
          message: `POAI del año ${año} (periodo ${periodo}) cargado correctamente`,
          data: poaiCompleto,
        };
      } catch (error) {
        return {
          status: false,
          message: 'Error al cargar POAI completo por año',
          error: error.message,
        };
      }
    }

    // Método privado para obtener datos completos con JOINs
    private async getPoaiCompletoWithJoins(poai: any, periodo: number): Promise<PoaiCompletoData> {
      // Mapear período a campo de período
      const mapeoPeriodos = {
        1: 'periodo_uno',
        2: 'periodo_dos',
        3: 'periodo_tres',
        4: 'periodo_cuatro'
      };

      const periodoCampo = mapeoPeriodos[periodo];

      // 1. Obtener topes presupuestales del período
      const { data: topesPresupuestales, error: topesError } = await this.supabaseService.clientAdmin
        .from('topes_presupuestales')
        .select(`
          *,
          fuentes_financiacion(
            id,
            nombre,
            marco_normativo
          )
        `)
        .eq('periodo', periodo)
        .order('fuente_id');

      // 2. Obtener banco de proyectos del período
      const { data: bancoProyectos, error: bancoError } = await this.supabaseService.clientAdmin
        .from('banco_proyectos')
        .select(`
          *,
          proyecto_metas(
            meta_producto_id,
            meta_producto(
              id,
              nombre,
              caracterizacion_mga(
                programa,
                producto,
                descripcion_producto
              )
            )
          )
        `)
        .eq('periodo', periodo)
        .order('created_at', { ascending: false });

      // 3. Obtener programación financiera del período específico
      const { data: programacionFinanciera } = await this.supabaseService.clientAdmin
        .from('programacion_financiera')
        .select(`
          *,
          fuente_financiacion:fuente_id(
            id,
            nombre,
            marco_normativo
          ),
          meta_producto:meta_id(
            id,
            nombre,
            caracterizacion_mga(
              programa,
              producto
            )
          )
        `)
        .gt(periodoCampo, 0)
        .order('meta_id');

      // 4. Obtener programación física del período específico
      const { data: programacionFisica } = await this.supabaseService.clientAdmin
        .from('programacion_fisica')
        .select(`
          *,
          meta_producto:meta_id(
            id,
            nombre,
            caracterizacion_mga(
              programa,
              producto
            )
          )
        `)
        .gt(periodoCampo, 0)
        .order('meta_id');

      // 5. Obtener todas las fuentes de financiación disponibles
      const { data: fuentesFinanciacion } = await this.supabaseService.clientAdmin
        .from('fuentes_financiacion')
        .select('*')
        .order('nombre');

      // 6. Calcular resumen ejecutivo
      const resumenEjecutivo = await this.calcularResumenEjecutivo(
        topesPresupuestales || [],
        bancoProyectos || [],
        programacionFinanciera || [],
        periodoCampo
      );

      return {
        poai: {
          ...poai,
          resumen_ejecutivo: resumenEjecutivo
        },
        topes_presupuestales: topesPresupuestales || [],
        banco_proyectos: bancoProyectos || [],
        programacion_financiera: programacionFinanciera || [],
        programacion_fisica: programacionFisica || [],
        fuentes_financiacion: fuentesFinanciacion || [],
        resumen_ejecutivo: resumenEjecutivo
      };
    }

    // Método para calcular resumen ejecutivo
    private async calcularResumenEjecutivo(
      topes: any[],
      proyectos: any[],
      programacionFinanciera: any[],
      periodoCampo: string
    ): Promise<any> {
      // Calcular total presupuesto (suma de topes)
      const totalPresupuesto = topes.reduce((sum, tope) => sum + Number(tope.tope_maximo), 0);

      // Calcular total asignado (suma de programación financiera del período)
      const totalAsignado = programacionFinanciera.reduce((sum, prog) => {
        return sum + Number(prog[periodoCampo] || 0);
      }, 0);

      // Calcular número de proyectos
      const numeroProyectos = proyectos.length;

      // Calcular porcentaje de ejecución
      const porcentajeEjecucion = totalPresupuesto > 0 ? (totalAsignado / totalPresupuesto) * 100 : 0;

      return {
        total_presupuesto: totalPresupuesto,
        total_asignado: totalAsignado,
        disponible: totalPresupuesto - totalAsignado,
        numero_proyectos: numeroProyectos,
        porcentaje_ejecucion: Math.round(porcentajeEjecucion * 100) / 100
      };
    }




}
