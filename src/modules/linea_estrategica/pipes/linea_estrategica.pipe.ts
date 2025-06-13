import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class ValidateLineaEstrategicaPipe implements PipeTransform {
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

    //Campos requeridos
    if (value.nombre === undefined || value.nombre.trim() === '') {
      throw new BadRequestException('El nombre es requerido');
    }

    if (value.descripcion === undefined || value.descripcion.trim() === '') {
      throw new BadRequestException('La descripción es requerida');
    }

    if (value.plan_nacional === undefined || value.plan_nacional.trim() === '') {
      throw new BadRequestException('El plan nacional es requerido');
    }

    if (value.plan_departamental === undefined || value.plan_departamental.trim() === '') {
      throw new BadRequestException('El plan departamental es requerido');
    }

    return value;
  }
}
