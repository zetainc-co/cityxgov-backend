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

    // Campos requeridos
    if (!value.nombre || value.nombre.trim() === '') {
      throw new BadRequestException('El nombre es requerido');
    }

    if (!value.plan_nacional || value.plan_nacional.trim() === '') {
      throw new BadRequestException('El plan nacional es requerido');
    }

    if (!value.plan_departamental || value.plan_departamental.trim() === '') {
      throw new BadRequestException('El plan departamental es requerido');
    }

    // Validaciones de longitud
    if (value.nombre.trim().length < 3) {
      throw new BadRequestException('El nombre debe tener al menos 3 caracteres');
    }

    if (value.nombre.trim().length > 200) {
      throw new BadRequestException('El nombre no puede tener más de 200 caracteres');
    }

    if (value.plan_nacional.trim().length < 3) {
      throw new BadRequestException('El plan nacional debe tener al menos 3 caracteres');
    }

    if (value.plan_nacional.trim().length > 300) {
      throw new BadRequestException('El plan nacional no puede tener más de 300 caracteres');
    }

    if (value.plan_departamental.trim().length < 3) {
      throw new BadRequestException('El plan departamental debe tener al menos 3 caracteres');
    }

    if (value.plan_departamental.trim().length > 300) {
      throw new BadRequestException('El plan departamental no puede tener más de 300 caracteres');
    }

    // La descripción es opcional pero si se proporciona debe tener longitud válida
    if (value.descripcion && value.descripcion.trim().length > 0) {
      if (value.descripcion.trim().length < 3) {
        throw new BadRequestException('La descripción debe tener al menos 3 caracteres');
      }
      if (value.descripcion.trim().length > 500) {
        throw new BadRequestException('La descripción no puede tener más de 500 caracteres');
      }
    }

    return value;
  }
}
