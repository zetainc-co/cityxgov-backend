import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendPasswordRecoveryEmail(email: string, otp: string) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || 'no-reply@cityxgov.com',
                to: email,
                subject: 'Recuperación de contraseña',
                text: `Tu código de recuperación es: ${otp}`,
                html: `<p>Tu código de recuperación es: <b>${otp}</b></p>`,
            });
        } catch (error) {
            throw new InternalServerErrorException('No se pudo enviar el correo de recuperación');
        }
    }

    async sendPasswordChangedEmail(email: string, nombre: string, apellido: string) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || 'no-reply@cityxgov.com',
                to: email,
                subject: 'Contraseña actualizada',
                text: `Hola ${nombre} ${apellido}, tu contraseña ha sido actualizada correctamente.`,
                html: `<p>Hola <b>${nombre} ${apellido}</b>,<br>Tu contraseña ha sido actualizada correctamente.</p>`,
            });
        } catch (error) {
            throw new InternalServerErrorException('No se pudo enviar el correo de confirmación');
        }
    }
}
