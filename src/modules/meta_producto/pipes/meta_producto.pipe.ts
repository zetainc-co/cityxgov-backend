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
      enfoque_poblacional_ids,
      linea_base,
      instrumento_planeacion,
      nombre,
      meta_numerica,
      orientacion,
      enfoque_territorial,
      meta_resultado_ids,
      codigo_programa,
      codigo_producto,
      codigo_sector,
      unidad_medida,
      unidad_medida_indicador_producto,
      nombre_indicador,
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
      enfoque_poblacional_ids: enfoque_poblacional_ids || [],
      linea_base: Number(linea_base),
      instrumento_planeacion: instrumento_planeacion.trim(),
      nombre: nombre.trim(),
      meta_numerica: meta_numerica.trim(),
      orientacion: orientacion.trim(),
      enfoque_territorial: enfoque_territorial || [],
      meta_resultado_ids: meta_resultado_ids,
      codigo_programa: codigo_programa.trim(),
      codigo_producto: codigo_producto.trim(),
      codigo_sector: codigo_sector.trim(),
      unidad_medida: unidad_medida?.trim() || '',
      unidad_medida_indicador_producto: unidad_medida_indicador_producto?.trim() || '',
      nombre_indicador: nombre_indicador?.trim() || '',
    };
  }

  private validateRequiredFields(value: any) {
    const requiredFields = [
      'caracterizacion_mga_id',
      'area_id',
      'ods_id',
      'linea_base',
      'instrumento_planeacion',
      'nombre',
      'meta_numerica',
      'orientacion',
      'enfoque_territorial',
      'meta_resultado_ids',
      'codigo_programa',
      'codigo_producto',
      'codigo_sector',
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

    // Validar linea_base como number
    const lineaBaseValue = Number(value.linea_base);
    if (isNaN(lineaBaseValue) || lineaBaseValue < 0) {
      throw new BadRequestException({
        status: false,
        message: 'linea_base debe ser un número válido mayor o igual a 0',
        data: [],
      });
    }

    // Validar campos de texto
    const stringFields = [
      'instrumento_planeacion',
      'nombre',
      'meta_numerica',
      'orientacion',
      'codigo_programa',
      'codigo_producto',
      'codigo_sector',
    ];

    // Validar campos de texto opcionales
    const optionalStringFields = [
      'unidad_medida',
      'unidad_medida_indicador_producto',
      'nombre_indicador',
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

    // Validar campos de texto opcionales
    optionalStringFields.forEach((field) => {
      if (value[field] && typeof value[field] !== 'string') {
        throw new BadRequestException({
          status: false,
          message: `${field} debe ser una cadena de texto`,
          data: [],
        });
      }

      if (value[field] && value[field].length > 255) {
        throw new BadRequestException({
          status: false,
          message: `${field} no puede tener más de 255 caracteres`,
          data: [],
        });
      }
    });
  }

  private validateArrayFields(value: any) {
    // Validar enfoque_poblacional_ids (opcional) - viene del modulo enfoque_poblacional
    if (value.enfoque_poblacional_ids && !Array.isArray(value.enfoque_poblacional_ids)) {
      throw new BadRequestException({
        status: false,
        message: 'enfoque_poblacional_ids debe ser un array',
        data: [],
      });
    }

    if (value.enfoque_poblacional_ids && Array.isArray(value.enfoque_poblacional_ids) && value.enfoque_poblacional_ids.length > 0) {
      // Validar que todos los IDs sean números positivos
      const invalidIds = value.enfoque_poblacional_ids.filter((id: any) => {
        const numId = Number(id);
        return isNaN(numId) || !Number.isInteger(numId) || numId <= 0;
      });

      if (invalidIds.length > 0) {
        throw new BadRequestException({
          status: false,
          message:
            'Todos los IDs de enfoque_poblacional_ids deben ser números enteros positivos',
          data: [],
        });
      }
    }

    // Validar enfoque_territorial (obligatorio) - solo valores 1 (Urbano) o 2 (Rural)
    if (!value.enfoque_territorial || !Array.isArray(value.enfoque_territorial)) {
      throw new BadRequestException({
        status: false,
        message: 'enfoque_territorial debe ser un array',
        data: [],
      });
    }

    if (value.enfoque_territorial.length === 0) {
      throw new BadRequestException({
        status: false,
        message: 'Debe seleccionar al menos un enfoque territorial',
        data: [],
      });
    }

    // Validar que solo contenga valores 1 o 2
    const valoresValidos = [1, 2];
    const valoresInvalidos = value.enfoque_territorial.filter((id: any) => {
      const numId = Number(id);
      return isNaN(numId) || !Number.isInteger(numId) || !valoresValidos.includes(numId);
    });

    if (valoresInvalidos.length > 0) {
      throw new BadRequestException({
        status: false,
        message: 'Los valores de enfoque territorial solo pueden ser 1 (Urbano) o 2 (Rural)',
        data: [],
      });
    }

    // Validar meta_resultado_ids
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
    const invalidMetaResultadoIds = value.meta_resultado_ids.filter((id: any) => {
      const numId = Number(id);
      return isNaN(numId) || !Number.isInteger(numId) || numId <= 0;
    });

    if (invalidMetaResultadoIds.length > 0) {
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
