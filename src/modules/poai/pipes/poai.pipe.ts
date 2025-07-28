import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PoaiPipe implements PipeTransform {
  transform(value: any) {
    if (!value) {
      throw new BadRequestException('Datos requeridos');
    }

    // Validar que el año sea válido
    if (value.año && (value.año < 2020 || value.año > 2030)) {
      throw new BadRequestException('Año debe estar entre 2020 y 2030');
    }

    return value;
  }
}
