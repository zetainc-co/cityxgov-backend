import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { FinanciacionPeriodoRequest } from '../dto/financiacion_periodo.dto';

@Injectable()
export class CreateFinanciacionPeriodoPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): FinanciacionPeriodoRequest {
    
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

    const { fuente_id, meta_id, periodo, fuente_financiacion, valor } = value;

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

    if (!periodo) {
      throw new BadRequestException({
        status: false,
        message: 'El periodo es requerido',
        data: [],
      });
    }

    if (!fuente_financiacion) {
      throw new BadRequestException({
        status: false,
        message: 'La fuente de financiación es requerida',
        data: [],
      });
    }

    if (valor === undefined || valor === null) {
      throw new BadRequestException({
        status: false,
        message: 'El valor es requerido',
        data: [],
      });
    }

    // Validaciones de tipos
    if (!Number.isInteger(fuente_id) || fuente_id <= 0) {
      throw new BadRequestException({
        status: false,
        message: 'El ID de fuente de financiación debe ser un número entero positivo',
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

    if (typeof periodo !== 'string') {
      throw new BadRequestException({
        status: false,
        message: 'El periodo debe ser una cadena de texto',
        data: [],
      });
    }

    if (typeof fuente_financiacion !== 'string') {
      throw new BadRequestException({
        status: false,
        message: 'La fuente de financiación debe ser una cadena de texto',
        data: [],
      });
    }

    if (typeof valor !== 'number' || valor < 0) {
      throw new BadRequestException({
        status: false,
        message: 'El valor debe ser un número positivo o cero',
        data: [],
      });
    }

    this.validateStringFields(periodo, fuente_financiacion);
    this.validateNumericFields(valor);

    return {
      fuente_id,
      meta_id,
      periodo: periodo.trim(),
      fuente_financiacion: fuente_financiacion.trim(),
      valor,
    };
  }

  private validateStringFields(periodo: string, fuente_financiacion: string) {
    // Validaciones para periodo
    if (periodo.trim() === '') {
      throw new BadRequestException({
        status: false,
        message: 'El periodo no puede estar vacío',
        data: [],
      });
    }

    if (periodo.length < 4) {
      throw new BadRequestException({
        status: false,
        message: 'El periodo debe tener al menos 4 caracteres',
        data: [],
      });
    }

    if (periodo.length > 50) {
      throw new BadRequestException({
        status: false,
        message: 'El periodo no puede tener más de 50 caracteres',
        data: [],
      });
    }

    // Validaciones para fuente_financiacion
    if (fuente_financiacion.trim() === '') {
      throw new BadRequestException({
        status: false,
        message: 'La fuente de financiación no puede estar vacía',
        data: [],
      });
    }

    if (fuente_financiacion.length < 3) {
      throw new BadRequestException({
        status: false,
        message: 'La fuente de financiación debe tener al menos 3 caracteres',
        data: [],
      });
    }

    if (fuente_financiacion.length > 200) {
      throw new BadRequestException({
        status: false,
        message: 'La fuente de financiación no puede tener más de 200 caracteres',
        data: [],
      });
    }

    // Validación de caracteres especiales y HTML
    const htmlRegex = /<[^>]*>/g;
    const scriptRegex = /<script[\s\S]*?<\/script>/gi;

    if (htmlRegex.test(periodo) || scriptRegex.test(periodo)) {
      throw new BadRequestException({
        status: false,
        message: 'El periodo no puede contener código HTML o scripts',
        data: [],
      });
    }

    if (htmlRegex.test(fuente_financiacion) || scriptRegex.test(fuente_financiacion)) {
      throw new BadRequestException({
        status: false,
        message: 'La fuente de financiación no puede contener código HTML o scripts',
        data: [],
      });
    }
  }

  private validateNumericFields(valor: number) {
    // Validar límites de valor
    if (valor > 999999999999.99) {
      throw new BadRequestException({
        status: false,
        message: 'El valor no puede ser mayor a 999,999,999,999.99',
        data: [],
      });
    }

    // Validar decimales (máximo 2)
    const decimalPart = valor.toString().split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      throw new BadRequestException({
        status: false,
        message: 'El valor no puede tener más de 2 decimales',
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