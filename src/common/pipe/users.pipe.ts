import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ValidateUserPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const missingFields = this.getMissingFields(value);
    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Campos faltantes: ${missingFields.join(', ')}`,
      );
    }
    return value;
  }

  private getMissingFields(value: any): string[] {
    const missingFields: string[] = [];

    if (!value) return ['request body is required'];
    if (!value.user) return ['user is required'];

    const requiredFields = [
      'identification',
      'first_name',
      'last_name',
      'phone',
      'email',
      'roles',
    ];

    requiredFields.forEach((field) => {
      if (value.user[field] === undefined || value.user[field] === null) {
        missingFields.push(`user.${field}`);
      }
    });

    // Verificamos tipos de datos
    if (
      value.user.identification !== undefined &&
      typeof value.user.identification !== 'number'
    ) {
      missingFields.push('identification debe ser número');
    }

    if (
      value.user.roles !== undefined &&
      (!Array.isArray(value.user.roles) || value.user.roles.length === 0)
    ) {
      missingFields.push('roles debe ser un array no vacío');
    }

    if (
      value.user.phone !== undefined &&
      typeof value.user.phone !== 'string'
    ) {
      missingFields.push('phone debe ser string');
    }

    if (
      value.user.email !== undefined &&
      typeof value.user.email !== 'string'
    ) {
      missingFields.push('email debe ser string');
    }

    return missingFields;
  }
}
