// import {
//     Get,
//     Post,
//     Body,
//     Param,
//     Delete,
//     UseGuards,
//     Controller,
//     ParseIntPipe,
//     ValidationPipe,
//     Put
// } from '@nestjs/common';
// import { UsuarioAreaService } from './usuario_area.service';
// import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
// import { Roles } from 'src/modules/rol/decorator/roles.decorator';
// import { UpdateUsuarioAreaDto, UpdateUsuarioAreaRequest, UsuarioAreaRequest } from './dto/usuario_area.dto';
// import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';

// @Controller('usuario-area')
// @Roles('superadmin', 'admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class UsuarioAreaController {
//     constructor(private readonly usuarioAreaService: UsuarioAreaService) { }

//     // Crear nueva asignación
//     @Post()
//     async create( @Body(ValidationPipe) body: UsuarioAreaRequest ) {
//         return await this.usuarioAreaService.create(body);
//     }

//     // Obtener todas las asignaciones
//     @Get()
//     async findAll() {
//         return await this.usuarioAreaService.findAll();
//     }

//     // Obtener asignaciones por usuario
//     @Get('usuario/:userId')
//     async findByUser( @Param('userId', ParseIntPipe) userId: number ) {
//         return await this.usuarioAreaService.findByUser(userId);
//     }

//     // Actualizar una asignación específica
//     @Put(':id')
//     async update( @Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) body: UpdateUsuarioAreaDto) {
//         return await this.usuarioAreaService.update(id, body.usuarioArea);
//     }

//     // Eliminar una asignación específica
//     @Delete(':id')
//     async delete( @Param('id', ParseIntPipe) id: number) {
//         return await this.usuarioAreaService.delete(id);
//     }

//     // Eliminar todas las asignaciones de un usuario
//     @Delete('usuario/:userId')
//     async deleteAllByUser(@Param('userId', ParseIntPipe) userId: number) {
//         return await this.usuarioAreaService.deleteAllByUser(userId);
//     }
// }
