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

    const { nombre, descripcion } = value;

    if (!nombre) {
      throw new BadRequestException({
        status: false,
        message: 'El nombre es requerido',
        data: [],
      });
    }

    if (!descripcion) {
      throw new BadRequestException({
        status: false,
        message: 'La descripción es requerida',
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

    if (typeof descripcion !== 'string') {
      throw new BadRequestException({
        status: false,
        message: 'La descripción debe ser una cadena de texto',
        data: [],
      });
    }

    this.validateRequiredFields(nombre, descripcion);

    return {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
    };
  }

  private validateRequiredFields(nombre: string, descripcion: string) {
    // Validaciones para nombre
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

    // Validaciones para descripción
    if (descripcion.trim() === '') {
      throw new BadRequestException({
        status: false,
        message: 'La descripción no puede estar vacía',
        data: [],
      });
    }

    if (descripcion.length < 10) {
      throw new BadRequestException({
        status: false,
        message: 'La descripción debe tener al menos 10 caracteres',
        data: [],
      });
    }

    if (descripcion.length > 500) {
      throw new BadRequestException({
        status: false,
        message: 'La descripción no puede tener más de 500 caracteres',
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

    return numericValue;
  }
}
