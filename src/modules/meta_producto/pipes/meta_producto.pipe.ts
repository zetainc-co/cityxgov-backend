import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { MetaProductoRequest } from '../dto/meta_producto.dto';

@Injectable()
export class CreateMetaProductoPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): MetaProductoRequest {
    if (!value) {
      throw new BadRequestException({
        status: false,
        message: 'Los datos son requeridos',
        data: [],
      });
    }

    // Verificar que es un objeto válido y no un array
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException({
        status: false,
        message: 'Los datos deben ser un objeto válido',
        data: [],
      });
    }

    const {
      caracterizacion_mga_id,
      area_id,
      ods_id,
      enfoque_poblacional_id,
      // codigo,
      linea_base,
      instrumento_planeacion,
      nombre,
      meta_numerica,
      orientacion,
      // sector,
      total_cuatrienio,
      meta_resultado_ids,
    } = value;

    // Validar campos requeridos
    this.validateRequiredFields(value);

    // Validar tipos y formatos
    this.validateFieldTypes(value);

    // Validar arrays
    this.validateArrayFields(value);

    return {
      caracterizacion_mga_id: Number(caracterizacion_mga_id),
      area_id: Number(area_id),
      ods_id: Number(ods_id),
      enfoque_poblacional_id: Number(enfoque_poblacional_id),
      // codigo: codigo.trim(),
      linea_base: linea_base.trim(),
      instrumento_planeacion: instrumento_planeacion.trim(),
      nombre: nombre.trim(),
      meta_numerica: meta_numerica.trim(),
      orientacion: orientacion.trim(),
      // sector: sector.trim(),
      total_cuatrienio: total_cuatrienio.trim(),
      meta_resultado_ids: meta_resultado_ids,
    };
  }

  private validateRequiredFields(value: any) {
    const requiredFields = [
      'caracterizacion_mga_id',
      'area_id',
      'ods_id',
      'enfoque_poblacional_id',
      // 'codigo',
      'linea_base',
      'instrumento_planeacion',
      'nombre',
      'meta_numerica',
      'orientacion',
      // 'sector',
      'total_cuatrienio',
      'meta_resultado_ids',
    ];

    const missingFields = requiredFields.filter((field) => {
      const fieldValue = value[field];
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        (typeof fieldValue === 'string' && fieldValue.trim() === '')
      );
    });

    if (missingFields.length > 0) {
      throw new BadRequestException({
        status: false,
        message: `Los siguientes campos son requeridos: ${missingFields.join(', ')}`,
        data: [],
      });
    }
  }

  private validateFieldTypes(value: any) {
    // Validar IDs numéricos
    const numericFields = [
      'caracterizacion_mga_id',
      'area_id',
      'ods_id',
      'enfoque_poblacional_id',
    ];

    numericFields.forEach((field) => {
      const numValue = Number(value[field]);
      if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
        throw new BadRequestException({
          status: false,
          message: `${field} debe ser un número entero positivo`,
          data: [],
        });
      }
    });

    // Validar campos de texto
    const stringFields = [
      'linea_base',
      'instrumento_planeacion',
      'nombre',
      'meta_numerica',
      'orientacion',
      'total_cuatrienio',
    ];

    stringFields.forEach((field) => {
      if (typeof value[field] !== 'string') {
        throw new BadRequestException({
          status: false,
          message: `${field} debe ser una cadena de texto`,
          data: [],
        });
      }

      if (value[field].trim().length < 1) {
        throw new BadRequestException({
          status: false,
          message: `${field} no puede estar vacío`,
          data: [],
        });
      }

      if (value[field].length > 255) {
        throw new BadRequestException({
          status: false,
          message: `${field} no puede tener más de 255 caracteres`,
          data: [],
        });
      }
    });
  }

  private validateArrayFields(value: any) {
    if (!Array.isArray(value.meta_resultado_ids)) {
      throw new BadRequestException({
        status: false,
        message: 'meta_resultado_ids debe ser un array',
        data: [],
      });
    }

    if (value.meta_resultado_ids.length === 0) {
      throw new BadRequestException({
        status: false,
        message: 'Debe seleccionar al menos una meta de resultado',
        data: [],
      });
    }

    // Validar que todos los IDs sean números positivos
    const invalidIds = value.meta_resultado_ids.filter((id: any) => {
      const numId = Number(id);
      return isNaN(numId) || !Number.isInteger(numId) || numId <= 0;
    });

    if (invalidIds.length > 0) {
      throw new BadRequestException({
        status: false,
        message:
          'Todos los IDs de meta_resultado deben ser números enteros positivos',
        data: [],
      });
    }
  }
}

@Injectable()
export class ValidateIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException({
        status: false,
        message: 'El ID es requerido',
        data: [],
      });
    }

    const numericValue = typeof value === 'string' ? Number(value) : value;

    if (isNaN(numericValue) || !Number.isInteger(numericValue)) {
      throw new BadRequestException({
        status: false,
        message: 'El ID debe ser un número entero válido',
        data: [],
      });
    }

    if (numericValue <= 0) {
      throw new BadRequestException({
        status: false,
        message: 'El ID debe ser un número positivo mayor a 0',
        data: [],
      });
    }

    return numericValue;
  }
}
