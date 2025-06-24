import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { AreaRequest } from '../dto/area.dto';

@Injectable()
export class ValidateAreaPipe implements PipeTransform<AreaRequest> {
  constructor(private supabaseService: SupabaseService) {}

  async transform(value: AreaRequest) {
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

    // Para requests de crear/actualizar, validar directamente
    if (!value.nombre || value.nombre.trim() === '') {
      throw new BadRequestException('El nombre es requerido');
    }

    // Validaciones de longitud para nombre
    if (value.nombre.trim().length < 3) {
      throw new BadRequestException('El nombre debe tener al menos 3 caracteres');
    }

    if (value.nombre.trim().length > 150) {
      throw new BadRequestException('El nombre no puede tener más de 150 caracteres');
    }

    // La descripción es opcional pero si se proporciona debe tener longitud válida
    if (value.descripcion && value.descripcion.trim().length > 0) {
      if (value.descripcion.trim().length < 3) {
        throw new BadRequestException('La descripción debe tener al menos 3 caracteres');
      }
      if (value.descripcion.trim().length > 400) {
        throw new BadRequestException('La descripción no puede tener más de 400 caracteres');
      }
    }

    return value;
  }
}
