import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class ValidateProgramaPipe implements PipeTransform {
  constructor(private supabaseService: SupabaseService) {}

  async transform(value: any) {
    // Si es un ID (para búsqueda, actualización o eliminación)
    if (typeof value === 'string') {
      const id = parseInt(value);
      if (isNaN(id)) {
        throw new BadRequestException('El ID debe ser un número');
      }
      if (id <= 0) {
        throw new BadRequestException('El ID debe ser un número positivo');
      }
      return id;
    }

    // Campos requeridos
    if (!value.nombre || value.nombre.trim() === '') {
      throw new BadRequestException('El nombre es requerido');
    }

    if (!value.linea_estrategica_id) {
      throw new BadRequestException('La línea estratégica es requerida');
    }

    // Validar que linea_estrategica_id sea un número positivo
    const lineaEstrategicaId = Number(value.linea_estrategica_id);
    if (
      isNaN(lineaEstrategicaId) ||
      !Number.isInteger(lineaEstrategicaId) ||
      lineaEstrategicaId <= 0
    ) {
      throw new BadRequestException(
        'El ID de línea estratégica debe ser un número entero positivo',
      );
    }

    return value;
  }
}
