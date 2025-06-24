import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';


@Injectable()
export class PasswordValidationPipe implements PipeTransform {
    transform(value: any) {
        if (!value) {
            throw new BadRequestException('Todos los campos son requeridos.');
        }
        if (!value.currentPassword || typeof value.currentPassword !== 'string') {
            throw new BadRequestException('La contraseña actual es requerida.');
        }
        if (!value.newPassword || typeof value.newPassword !== 'string') {
            throw new BadRequestException('La nueva contraseña es requerida.');
        }
        if (!value.confirmPassword || typeof value.confirmPassword !== 'string') {
            throw new BadRequestException('La confirmación de la nueva contraseña es requerida.');
        }
        if (value.currentPassword === value.newPassword) {
            throw new BadRequestException('La nueva contraseña no puede ser igual a la anterior.');
        }
        const password = value.newPassword;
        if (password.length < 8) {
            throw new BadRequestException('La contraseña debe tener al menos 8 caracteres.');
        }
        if (!/[A-Za-z]/.test(password)) {
            throw new BadRequestException('La contraseña debe contener al menos una letra.');
        }
        if (!/\d/.test(password)) {
            throw new BadRequestException('La contraseña debe contener al menos un número.');
        }
        if (!/[.,!@#$%^&*]/.test(password)) {
            throw new BadRequestException('La contraseña debe contener al menos un símbolo (por ejemplo: . , ! @ # $ % ^ & *).');
        }
        if (value.newPassword !== value.confirmPassword) {
            throw new BadRequestException('La nueva contraseña y la confirmación no coinciden.');
        }
        return value;
    }
}

