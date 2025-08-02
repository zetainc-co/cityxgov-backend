import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { FuentesFinanciacionRequest } from '../dto/fuentes_financiacion';

@Injectable()
export class CreateFuentesFinanciacionPipe implements PipeTransform {
  transform(
    value: any,
    metadata: ArgumentMetadata,
  ): FuentesFinanciacionRequest {
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

    const { nombre, codigo_fuente, marco_normativo } = value;

    // Validar que nombre esté presente
    if (!nombre) {
      throw new BadRequestException({
        status: false,
        message: 'El nombre es requerido',
        data: [],
      });
    }

    // Validar que nombre sea string
    if (typeof nombre !== 'string') {
      throw new BadRequestException({
        status: false,
        message: 'El nombre debe ser una cadena de texto',
        data: [],
      });
    }

    // Validar longitud del nombre
    if (nombre.trim().length < 3) {
      throw new BadRequestException({
        status: false,
        message: 'El nombre debe tener al menos 3 caracteres',
        data: [],
      });
    }

    if (nombre.trim().length > 100) {
      throw new BadRequestException({
        status: false,
        message: 'El nombre no puede tener más de 100 caracteres',
        data: [],
      });
    }

    // Validar que codigo_fuente esté presente
    if (!codigo_fuente) {
      throw new BadRequestException({
        status: false,
        message: 'El código de fuente es requerido',
        data: [],
      });
    }

    // Validar que codigo_fuente sea string
    if (typeof codigo_fuente !== 'string') {
      throw new BadRequestException({
        status: false,
        message: 'El código de fuente debe ser una cadena de texto',
        data: [],
      });
    }

    // Validar longitud del codigo_fuente
    if (codigo_fuente.trim().length < 2) {
      throw new BadRequestException({
        status: false,
        message: 'El código de fuente debe tener al menos 2 caracteres',
        data: [],
      });
    }

    if (codigo_fuente.trim().length > 20) {
      throw new BadRequestException({
        status: false,
        message: 'El código de fuente no puede tener más de 20 caracteres',
        data: [],
      });
    }

    // Validar marco_normativo si está presente
    if (marco_normativo !== undefined && marco_normativo !== null) {
      if (typeof marco_normativo !== 'string') {
        throw new BadRequestException({
          status: false,
          message: 'El marco normativo debe ser una cadena de texto',
          data: [],
        });
      }

      if (marco_normativo.trim().length > 500) {
        throw new BadRequestException({
          status: false,
          message: 'El marco normativo no puede tener más de 500 caracteres',
          data: [],
        });
      }
    }

    return {
      nombre: nombre.trim(),
      codigo_fuente: codigo_fuente.trim(),
      marco_normativo: marco_normativo?.trim() || undefined,
    };
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

    return numericValue;
  }
}
