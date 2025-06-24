import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { OdsRequest } from '../dto/ods.dto';

@Injectable()
export class CreateOdsPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): OdsRequest {
    
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

    const { nombre } = value;

    if (!nombre) {
      throw new BadRequestException({
        status: false,
        message: 'El nombre es requerido',
        data: [],
      });
    }

    if (typeof nombre !== 'string') {
      throw new BadRequestException({
        status: false,
        message: 'El nombre debe ser una cadena de texto',
        data: [],
      });
    }

    this.validateRequiredFields(nombre);

    return {
      nombre: nombre.trim(),
    };
  }

  private validateRequiredFields(nombre: string) {
    if (nombre.trim() === '') {
      throw new BadRequestException({
        status: false,
        message: 'El nombre no puede estar vacío',
        data: [],
      });
    }

    if (nombre.length < 3) {
      throw new BadRequestException({
        status: false,
        message: 'El nombre debe tener al menos 3 caracteres',
        data: [],
      });
    }

    if (nombre.length > 100) {
      throw new BadRequestException({
        status: false,
        message: 'El nombre no puede tener más de 100 caracteres',
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

    // Verificir que sea positivo
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
