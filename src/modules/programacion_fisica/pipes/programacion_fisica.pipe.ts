import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ProgramacionFisicaRequest } from '../dto/programacion_fisica.dto';

@Injectable()
export class CreateProgramacionFisicaPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): ProgramacionFisicaRequest {
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

    const { meta_id, periodo_2024, periodo_2025, periodo_2026, periodo_2027 } =
      value;

    // Validaciones de campos requeridos
    if (meta_id === undefined || meta_id === null) {
      throw new BadRequestException({
        status: false,
        message: 'El ID de meta producto es requerido',
        data: [],
      });
    }

    // Validaciones de tipos para IDs
    if (!Number.isInteger(meta_id) || meta_id <= 0) {
      throw new BadRequestException({
        status: false,
        message: 'El ID de meta producto debe ser un número entero positivo',
        data: [],
      });
    }

    // Validar y limpiar valores de períodos (usando valores por defecto si no están presentes)
    const periodos = {
      periodo_2024: this.validatePeriodoValue(periodo_2024 ?? null, '2024'),
      periodo_2025: this.validatePeriodoValue(periodo_2025 ?? null, '2025'),
      periodo_2026: this.validatePeriodoValue(periodo_2026 ?? null, '2026'),
      periodo_2027: this.validatePeriodoValue(periodo_2027 ?? null, '2027'),
    };

    return {
      meta_id,
      ...periodos,
    };
  }

  private validatePeriodoValue(value: any, periodo: string): number {
    // Si es undefined, null, vacío o string vacío, retornar 0
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return 0;
    }

    // Convertir a número si es string
    let numericValue: number;
    if (typeof value === 'string') {
      // Limpiar el valor de caracteres no numéricos excepto punto y coma
      const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
      numericValue = Number(cleanValue);
    } else {
      numericValue = value;
    }

    // Verificar que sea un número válido
    if (isNaN(numericValue) || typeof numericValue !== 'number') {
      throw new BadRequestException({
        status: false,
        message: `La cantidad del período ${periodo} debe ser un número válido`,
        data: [],
      });
    }

    // Verificar que no sea negativo
    if (numericValue < 0) {
      throw new BadRequestException({
        status: false,
        message: `La cantidad del período ${periodo} no puede ser negativa`,
        data: [],
      });
    }

    // Convertir a entero (redondear)
    return Math.round(numericValue);
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

    // Convertir a número si es string
    const numericValue = typeof value === 'string' ? Number(value) : value;

    // Verificar que sea un número válido
    if (isNaN(numericValue) || !Number.isInteger(numericValue)) {
      throw new BadRequestException({
        status: false,
        message: 'El ID debe ser un número entero válido',
        data: [],
      });
    }

    // Verificar que sea positivo
    if (numericValue <= 0) {
      throw new BadRequestException({
        status: false,
        message: 'El ID debe ser un número positivo mayor a 0',
        data: [],
      });
    }

    // Límite de seguridad para IDs
    if (numericValue > 2147483647) {
      throw new BadRequestException({
        status: false,
        message: 'El ID es demasiado grande',
        data: [],
      });
    }

    return numericValue;
  }
}
