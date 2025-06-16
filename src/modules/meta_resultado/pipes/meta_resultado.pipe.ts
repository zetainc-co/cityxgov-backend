import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidateMetaResultadoPipe implements PipeTransform {
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

    // Validaciones de campos requeridos
    if (!value.nombre || value.nombre.trim() === '') {
      throw new BadRequestException('El nombre es requerido');
    }
    if (!value.indicador || value.indicador.trim() === '') {
      throw new BadRequestException('El indicador es requerido');
    }
    if (!value.linea_base || value.linea_base.trim() === '') {
      throw new BadRequestException('La línea base es requerida');
    }
    if (!value.año_linea_base || isNaN(Number(value.año_linea_base))) {
      throw new BadRequestException('El año de la línea base es requerido y debe ser un número');
    }
    if (!value.meta_cuatrienio || value.meta_cuatrienio.trim() === '') {
      throw new BadRequestException('La meta cuatrienio es requerida');
    }
    if (!value.fuente || value.fuente.trim() === '') {
      throw new BadRequestException('La fuente es requerida');
    }
    if (!value.linea_estrategica_id || isNaN(Number(value.linea_estrategica_id))) {
      throw new BadRequestException('El id de línea estratégica es requerido y debe ser un número');
    }

    return value;
  }
}
