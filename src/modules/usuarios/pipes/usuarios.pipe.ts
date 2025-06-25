import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { UsuarioRequest, UsuarioUpdateRequest } from '../dto/usuarios.dto';

@Injectable()
export class ValidateUsuarioPipe implements PipeTransform {
  constructor(private supabaseService: SupabaseService) {}

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

    // Para requests de crear/actualizar
    return this.validateUserData(value);
  }

  private validateUserData(value: any) {
    // Validaciones para crear usuario (UsuarioRequest)
    if (this.isCreateRequest(value)) {
      return this.validateCreateRequest(value);
    }

    // Validaciones para actualizar usuario (UsuarioUpdateRequest)
    return this.validateUpdateRequest(value);
  }

  private isCreateRequest(value: any): boolean {
    // Es create si tiene campos requeridos para crear
    return value.identificacion !== undefined &&
           value.nombre !== undefined &&
           value.apellido !== undefined;
  }

  private validateCreateRequest(value: any): UsuarioRequest {
    // Campos requeridos
    if (!value.identificacion || value.identificacion <= 0) {
      throw new BadRequestException('La identificación es requerida y debe ser un número positivo');
    }

    if (!value.nombre || value.nombre.trim() === '') {
      throw new BadRequestException('El nombre es requerido');
    }

    if (!value.apellido || value.apellido.trim() === '') {
      throw new BadRequestException('El apellido es requerido');
    }

    if (!value.telefono || value.telefono.trim() === '') {
      throw new BadRequestException('El teléfono es requerido');
    }

    if (!value.correo || value.correo.trim() === '') {
      throw new BadRequestException('El correo electrónico es requerido');
    }

    if (!value.area_id || value.area_id <= 0) {
      throw new BadRequestException('El área es requerida');
    }

    if (!value.rol_id || value.rol_id <= 0) {
      throw new BadRequestException('El rol es requerido');
    }

    // Validaciones de formato y longitud
    this.validateCommonFields(value);

    return value;
  }

  private validateUpdateRequest(value: any): UsuarioUpdateRequest {
    // En update todos los campos son opcionales, pero si se proporcionan deben ser válidos
    if (value.identificacion !== undefined && value.identificacion <= 0) {
      throw new BadRequestException('La identificación debe ser un número positivo');
    }

    if (value.area_id !== undefined && value.area_id <= 0) {
      throw new BadRequestException('El área debe ser un número positivo');
    }

    if (value.rol_id !== undefined && value.rol_id <= 0) {
      throw new BadRequestException('El rol debe ser un número positivo');
    }

    // Validar campos comunes si están presentes
    this.validateCommonFields(value, false);

    return value;
  }

  private validateCommonFields(value: any, isRequired: boolean = true) {
    // Validación del nombre
    if (value.nombre !== undefined) {
      if (isRequired && value.nombre.trim() === '') {
        throw new BadRequestException('El nombre no puede estar vacío');
      }
      if (value.nombre.trim().length < 2) {
        throw new BadRequestException('El nombre debe tener al menos 2 caracteres');
      }
      if (value.nombre.trim().length > 100) {
        throw new BadRequestException('El nombre no puede tener más de 100 caracteres');
      }
      // Solo letras, espacios y algunos caracteres especiales
      const nombrePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\']+$/;
      if (!nombrePattern.test(value.nombre.trim())) {
        throw new BadRequestException('El nombre contiene caracteres no válidos');
      }
    }

    // Validación del apellido
    if (value.apellido !== undefined) {
      if (isRequired && value.apellido.trim() === '') {
        throw new BadRequestException('El apellido no puede estar vacío');
      }
      if (value.apellido.trim().length < 2) {
        throw new BadRequestException('El apellido debe tener al menos 2 caracteres');
      }
      if (value.apellido.trim().length > 100) {
        throw new BadRequestException('El apellido no puede tener más de 100 caracteres');
      }
      const apellidoPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\']+$/;
      if (!apellidoPattern.test(value.apellido.trim())) {
        throw new BadRequestException('El apellido contiene caracteres no válidos');
      }
    }

    // Validación del teléfono
    if (value.telefono !== undefined) {
      if (isRequired && value.telefono.trim() === '') {
        throw new BadRequestException('El teléfono no puede estar vacío');
      }
      if (value.telefono.trim().length < 7) {
        throw new BadRequestException('El teléfono debe tener al menos 7 caracteres');
      }
      if (value.telefono.trim().length > 15) {
        throw new BadRequestException('El teléfono no puede tener más de 15 caracteres');
      }
      // Solo números, espacios, guiones y paréntesis
      const telefonoPattern = /^[0-9\s\-\(\)\+]+$/;
      if (!telefonoPattern.test(value.telefono.trim())) {
        throw new BadRequestException('El teléfono contiene caracteres no válidos');
      }
    }

    // Validación del correo
    if (value.correo !== undefined) {
      if (isRequired && value.correo.trim() === '') {
        throw new BadRequestException('El correo electrónico no puede estar vacío');
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value.correo.trim())) {
        throw new BadRequestException('El formato del correo electrónico no es válido');
      }
      if (value.correo.trim().length > 255) {
        throw new BadRequestException('El correo electrónico no puede tener más de 255 caracteres');
      }
    }

    // Validación de la descripción (opcional)
    if (value.descripcion !== undefined && value.descripcion !== null) {
      if (value.descripcion.trim().length > 0) {
        if (value.descripcion.trim().length < 3) {
          throw new BadRequestException('La descripción debe tener al menos 3 caracteres');
        }
        if (value.descripcion.trim().length > 500) {
          throw new BadRequestException('La descripción no puede tener más de 500 caracteres');
        }
      }
    }

    // Validación del cargo (opcional)
    if (value.cargo !== undefined && value.cargo !== null) {
      if (value.cargo.trim().length > 0) {
        if (value.cargo.trim().length < 2) {
          throw new BadRequestException('El cargo debe tener al menos 2 caracteres');
        }
        if (value.cargo.trim().length > 100) {
          throw new BadRequestException('El cargo no puede tener más de 100 caracteres');
        }
        // Solo letras, espacios y algunos caracteres especiales
        const cargoPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.\'\/\(\)]+$/;
        if (!cargoPattern.test(value.cargo.trim())) {
          throw new BadRequestException('El cargo contiene caracteres no válidos');
        }
      }
    }
  }
}
