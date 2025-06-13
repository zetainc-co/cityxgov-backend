import {
    Get,
    Body,
    Post,
    Param,
    UseGuards,
    Controller,
    HttpStatus,
    HttpCode,
    Patch,
    Delete,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosGuard } from './guard/usuarios.guard';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { NuevoUsuario, ActualizarUsuario, ActualizarEstadoUsuario } from './dto/usuarios.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    // Crear un nuevo usuario
    @Post()
    @Roles('superadmin')
    async create(@Body() createRequest: NuevoUsuario) {
        return await this.usuariosService.create(createRequest);
    }

    // Obtener todos los usuarios
    @Get()
    @Roles('admin', 'superadmin')
    async findAll() {
        return await this.usuariosService.findAll();
    }

    // Obtener todos los usuarios  con areas
    @Get('usuarios-areas')
    @Roles('admin', 'superadmin')
    async findAllUsuariosAreas() {
        return await this.usuariosService.findAllUsuariosAreas();
    }

    // Obtener un usuario por su identificación
    @Get(':identificacion')
    @Roles('admin', 'superadmin')
    async findOne(@Param('identificacion') identificacion: number) {
        return await this.usuariosService.findOne(identificacion);
    }


    // Actualizar un usuario por su identificación
    @Patch(':identificacion')
    @UseGuards(UsuariosGuard)
    async update(
        @Param('identificacion') identificacion: number,
        @Body() updateDto: ActualizarUsuario,
    ) {
        return await this.usuariosService.update(identificacion, updateDto);
    }

    // Actualizar el estado de un usuario
    @Patch(':identificacion/estado')
    @Roles('superadmin', 'admin')
    async actualizarEstado(
        @Param('identificacion') identificacion: number,
        @Body() dtoEstado: ActualizarEstadoUsuario,
    ) {
        return await this.usuariosService.actualizarEstado(identificacion, dtoEstado);
    }

    // Eliminar un usuario (propio usuario o superadmin)
    @Delete(':identificacion')
    @UseGuards(UsuariosGuard)
    async delete(
        @Param('identificacion') identificacion: number,
    ) {
        return await this.usuariosService.delete(identificacion);
    }
}
