import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { EntidadTerritorialRequest } from '../dto/entidad_territorial.dto';

@Injectable()
export class ValidateEntidadTerritorialPipe implements PipeTransform {
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

    // Validar entidad territorial
    if (this.isEntidadTerritorialRequest(value)) {
      return this.validateEntidadTerritorial(value);
    }

    return value;
  }

  private isEntidadTerritorialRequest(value: any): value is EntidadTerritorialRequest {
    return value && 'nombre_entidad' in value && 'nit' in value;
  }



  private validateEntidadTerritorial(value: EntidadTerritorialRequest): EntidadTerritorialRequest {
    // Validar nombre de la entidad
    if (!value.nombre_entidad || value.nombre_entidad.trim() === '') {
      throw new BadRequestException('El nombre de la entidad territorial es requerido');
    }
    if (value.nombre_entidad.trim().length > 100) {
      throw new BadRequestException('El nombre de la entidad no puede tener más de 100 caracteres');
    }

    // Validar nombre del representante legal
    if (!value.nombre_representante_legal || value.nombre_representante_legal.trim() === '') {
      throw new BadRequestException('El nombre del representante legal es requerido');
    }
    if (value.nombre_representante_legal.trim().length > 100) {
      throw new BadRequestException('El nombre del representante legal no puede tener más de 100 caracteres');
    }

    // Validar NIT
    if (!value.nit || value.nit.trim() === '') {
      throw new BadRequestException('El NIT es requerido');
    }
    if (value.nit.trim().length > 30) {
      throw new BadRequestException('El NIT no puede tener más de 30 caracteres');
    }
    // Validar formato NIT (números y guión para dígito verificador)
    const nitRegex = /^\d+(-\d)?$/;
    if (!nitRegex.test(value.nit.trim())) {
      throw new BadRequestException('El NIT debe tener formato válido (ej: 8999999-1)');
    }

    // Validar nombre del municipio
    if (!value.nombre_municipio || value.nombre_municipio.trim() === '') {
      throw new BadRequestException('El nombre del municipio es requerido');
    }

    // Validar departamento (solo requerido, acepta cualquier string)
    if (!value.departamento || value.departamento.trim() === '') {
      throw new BadRequestException('El departamento es requerido');
    }
    if (value.departamento.trim().length > 100) {
      throw new BadRequestException('El departamento no puede tener más de 100 caracteres');
    }

    // Validar categoría municipal (solo requerido, acepta cualquier string)
    if (!value.categoria_municipal || value.categoria_municipal.trim() === '') {
      throw new BadRequestException('La categoría municipal es requerida');
    }
    if (value.categoria_municipal.trim().length > 50) {
      throw new BadRequestException('La categoría municipal no puede tener más de 50 caracteres');
    }

    // Validar población
    if (!value.poblacion || isNaN(value.poblacion)) {
      throw new BadRequestException('La población debe ser un número válido');
    }
    if (value.poblacion <= 0) {
      throw new BadRequestException('La población debe ser mayor a 0');
    }

    // Validar descripción
    if (!value.descripcion || value.descripcion.trim() === '') {
      throw new BadRequestException('La descripción es requerida');
    }
    if (value.descripcion.trim().length > 500) {
      throw new BadRequestException('La descripción no puede tener más de 500 caracteres');
    }

    // Validar región (opcional)
    if (value.region && value.region.trim().length > 100) {
      throw new BadRequestException('La región no puede tener más de 100 caracteres');
    }

    // Validar coordenadas de geolocalización (opcionales)
    if (value.latitud !== undefined && value.latitud !== null) {
      if (isNaN(value.latitud)) {
        throw new BadRequestException('La latitud debe ser un número válido');
      }
      if (value.latitud < -90 || value.latitud > 90) {
        throw new BadRequestException('La latitud debe estar entre -90 y 90 grados');
      }
    }

    if (value.longitud !== undefined && value.longitud !== null) {
      if (isNaN(value.longitud)) {
        throw new BadRequestException('La longitud debe ser un número válido');
      }
      if (value.longitud < -180 || value.longitud > 180) {
        throw new BadRequestException('La longitud debe estar entre -180 y 180 grados');
      }
    }

    // Validar dirección completa (opcional)
    if (value.direccion_completa && value.direccion_completa.trim().length > 500) {
      throw new BadRequestException('La dirección completa no puede tener más de 500 caracteres');
    }

    return value;
  }
}
