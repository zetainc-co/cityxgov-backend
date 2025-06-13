import {
    Injectable,
    PipeTransform,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { CreateRoleRequest } from '../dto/rol.dto';

@Injectable()
export class ValidateRole implements PipeTransform<CreateRoleRequest> {

    constructor(private supabaseService: SupabaseService) {}

    async transform(value: any) {
        // If it's a string, assume it's an ID parameter
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

        // For create/update requests, validate the role object
        if (!value.role) {
            throw new BadRequestException('El objeto role es requerido');
        }

        if (!value.role.nombre || value.role.nombre.trim() === '') {
            throw new BadRequestException('El nombre es requerido');
        }

        if (!value.role.descripcion || value.role.descripcion.trim() === '') {
            throw new BadRequestException('La descripción es requerida');
        }

        return value;
    }
}
