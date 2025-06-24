import {
    Get,
    Body,
    Post,
    Param,
    Patch,
    Delete,
    UseGuards,
    Controller,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosGuard } from './guard/usuarios.guard';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { 
    UsuarioRequest, 
    ChangePasswordDto,
    UsuarioUpdateRequest, 
    ActualizarEstadoUsuario, 
} from './dto/usuarios.dto';
import { ValidateUsuarioPipe } from './pipes/usuarios.pipe';
import { PasswordValidationPipe } from './pipes/password.pipe';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    // Obtener todos los usuarios
    @Get()
    @Roles('admin', 'superadmin')
    async findAll() {
        return await this.usuariosService.findAll();
    }

    // Obtener un usuario por su ID
    @Get(':id')
    @Roles('admin', 'superadmin')
    async findOne(@Param('id', ValidateUsuarioPipe) id: number) {
        return await this.usuariosService.findOne(id);
    }

    // Crear un nuevo usuario (SE REQUIERE ÁREA Y ROL)
    @Post()
    @Roles('superadmin')
    async create(@Body(ValidateUsuarioPipe) createRequest: UsuarioRequest) {
        return await this.usuariosService.create(createRequest);
    }

    // Actualizar un usuario por su ID (SE PUEDE INCLUIR CAMBIO DE ÁREA Y ROL)
    @Patch(':id')
    @UseGuards(UsuariosGuard)
    async update(
        @Param('id', ValidateUsuarioPipe) id: number,
        @Body(ValidateUsuarioPipe) updateRequest: UsuarioUpdateRequest,
    ) {
        return await this.usuariosService.update(id, updateRequest);
    }

    // Actualizar el estado de un usuario (SE PUEDE ACTIVAR O DESACTIVAR)
    @Patch('estado/:id')
    @Roles('superadmin', 'admin')
    async actualizarEstado(
        @Param('id', ValidateUsuarioPipe) id: number,
        @Body() dtoEstado: ActualizarEstadoUsuario,
    ) {
        return await this.usuariosService.actualizarEstado(id, dtoEstado);
    }

    // Cambiar la contraseña de un usuario (SE REQUIERE CONTRASEÑA ACTUAL)
    @Patch('cambiar-clave/:id')
    async changePassword(
        @Param('id', ValidateUsuarioPipe) id: number,
        @Body(PasswordValidationPipe) dto: ChangePasswordDto,
    ) {
        return await this.usuariosService.changePassword(id, dto);
    }

    // Eliminar un usuario (ELIMINA USUARIO + ASIGNACIONES EN CASCADE)
    @Delete(':id')
    @UseGuards(UsuariosGuard)
    async delete(
        @Param('id', ValidateUsuarioPipe) id: number,
    ) {
        return await this.usuariosService.delete(id);
    }
}
