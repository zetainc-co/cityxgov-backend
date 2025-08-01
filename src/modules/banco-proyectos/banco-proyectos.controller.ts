import {
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Controller,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { BancoProyectosService } from './banco-proyectos.service';
import { BancoProyectosRequest } from './dto/banco-proyectos.dto';

@Controller('banco-proyectos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BancoProyectosController {
  constructor(private readonly bancoProyectosService: BancoProyectosService) { }

  // Obtener proyectos por periodo específico con relaciones
  @Get('periodo/:periodo')
  @Roles('superadmin', 'admin')
  async findByPeriodo(@Param('periodo') periodo: string) {
    return await this.bancoProyectosService.findByPeriodoWithRelations(+periodo);
  }

  // ENDPOINT TEMPORAL: Para verificar si el campo se llama año
  @Get('periodo-temp/:periodo')
  @Roles('superadmin', 'admin')
  async findByPeriodoTemp(@Param('periodo') periodo: string) {
    return await this.bancoProyectosService.findByPeriodoTemp(+periodo);
  }

  // Obtener un proyecto por ID con todas sus relaciones
  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.bancoProyectosService.findOne(+id);
  }

  // Crear nuevo proyecto
  @Post()
  @Roles('superadmin', 'admin')
  async create(@Body() createRequest: BancoProyectosRequest) {
    return await this.bancoProyectosService.create(createRequest);
  }

  // Actualizar proyecto
  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateRequest: BancoProyectosRequest
  ) {
    return await this.bancoProyectosService.update(+id, updateRequest);
  }

  // Eliminar proyecto
  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id') id: string) {
    return await this.bancoProyectosService.delete(+id);
  }
}
