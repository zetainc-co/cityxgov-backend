import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ProgramacionFinancieraRequest } from '../dto/programacion_financiera.dto';

@Injectable()
export class CreateProgramacionFinancieraPipe implements PipeTransform {
  transform(
    value: any,
    metadata: ArgumentMetadata,
  ): ProgramacionFinancieraRequest {
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
      fuente_id,
      meta_id,
      periodo_uno,
      periodo_dos,
      periodo_tres,
      periodo_cuatro,
    } = value;

    // Validaciones de campos requeridos
    if (fuente_id === undefined || fuente_id === null) {
      throw new BadRequestException({
        status: false,
        message: 'El ID de fuente de financiación es requerido',
        data: [],
      });
    }

    if (meta_id === undefined || meta_id === null) {
      throw new BadRequestException({
        status: false,
        message: 'El ID de meta producto es requerido',
        data: [],
      });
    }

    // Validaciones de tipos para IDs
    if (!Number.isInteger(fuente_id) || fuente_id <= 0) {
      throw new BadRequestException({
        status: false,
        message:
          'El ID de fuente de financiación debe ser un número entero positivo',
        data: [],
      });
    }

    if (!Number.isInteger(meta_id) || meta_id <= 0) {
      throw new BadRequestException({
        status: false,
        message: 'El ID de meta producto debe ser un número entero positivo',
        data: [],
      });
    }

    // Validar y limpiar valores de períodos (usando valores por defecto si no están presentes)
    const periodos = {
      periodo_uno: this.validatePeriodoValue(periodo_uno ?? null, 'uno'),
      periodo_dos: this.validatePeriodoValue(periodo_dos ?? null, 'dos'),
      periodo_tres: this.validatePeriodoValue(periodo_tres ?? null, 'tres'),
      periodo_cuatro: this.validatePeriodoValue(periodo_cuatro ?? null, 'cuatro'),
    };

    return {
      fuente_id,
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
      numericValue = Number(value.trim());
    } else {
      numericValue = value;
    }

    // Verificar que sea un número válido
    if (isNaN(numericValue) || typeof numericValue !== 'number') {
      throw new BadRequestException({
        status: false,
        message: `El valor del período ${periodo} debe ser un número válido`,
        data: [],
      });
    }

    // Verificar que no sea negativo
    if (numericValue < 0) {
      throw new BadRequestException({
        status: false,
        message: `El valor del período ${periodo} no puede ser negativo`,
        data: [],
      });
    }

    // Verificar que sea un entero
    if (!Number.isInteger(numericValue)) {
      throw new BadRequestException({
        status: false,
        message: `El valor del período ${periodo} debe ser un número entero`,
        data: [],
      });
    }

    return numericValue;
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
