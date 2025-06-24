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

    if (!value.meta_cuatrienio || value.meta_cuatrienio.trim() === '') {
      throw new BadRequestException('La meta cuatrienio es requerida');
    }

    if (!value.fuente || value.fuente.trim() === '') {
      throw new BadRequestException('La fuente es requerida');
    }

    // Validación robusta para año_linea_base
    if (!value.año_linea_base) {
      throw new BadRequestException('El año de la línea base es requerido');
    }

    const año = Number(value.año_linea_base);
    if (isNaN(año) || !Number.isInteger(año)) {
      throw new BadRequestException('El año de la línea base debe ser un número entero');
    }

    if (año < 1900 || año > 2100) {
      throw new BadRequestException('El año de la línea base debe estar entre 1900 y 2100');
    }

    // Validación robusta para linea_estrategica_id
    if (!value.linea_estrategica_id) {
      throw new BadRequestException('La línea estratégica es requerida');
    }

    const lineaEstrategicaId = Number(value.linea_estrategica_id);
    if (isNaN(lineaEstrategicaId) || !Number.isInteger(lineaEstrategicaId) || lineaEstrategicaId <= 0) {
      throw new BadRequestException('El ID de línea estratégica debe ser un número entero positivo');
    }

    // Validaciones de longitud
    if (value.nombre.trim().length < 3) {
      throw new BadRequestException('El nombre debe tener al menos 3 caracteres');
    }

    if (value.nombre.trim().length > 200) {
      throw new BadRequestException('El nombre no puede tener más de 200 caracteres');
    }

    if (value.indicador.trim().length < 3) {
      throw new BadRequestException('El indicador debe tener al menos 3 caracteres');
    }

    if (value.indicador.trim().length > 200) {
      throw new BadRequestException('El indicador no puede tener más de 200 caracteres');
    }

    return value;
  }
}
