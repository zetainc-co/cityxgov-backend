import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PoaiService } from './poai.service';
import { PoaiRequest, PoaiUpdateRequest, PoaiResponse } from './dto/poai.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { Request } from 'express';

@Controller('poai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoaiController {
  constructor(private readonly poaiService: PoaiService) {}

  // Obtener todos los POAIs
  @Get()
  @Roles('admin', 'superadmin', 'planificador', 'consultor')
  async findAll(): Promise<PoaiResponse> {
    return await this.poaiService.findAll();
  }

  // Obtener líneas estratégicas disponibles
  @Get('lineas-estrategicas')
  @Roles('admin', 'superadmin', 'planificador', 'consultor')
  async getLineasEstrategicas(): Promise<PoaiResponse> {
    const data = await this.poaiService.getLineasEstrategicasDisponibles();
    return {
      status: true,
      message: 'Líneas estratégicas obtenidas correctamente',
      data,
    };
  }

  // Obtener un POAI por ID
  @Get(':id')
  @Roles('admin', 'superadmin', 'planificador', 'consultor')
  async findOne(@Param('id') id: string): Promise<PoaiResponse> {
    return await this.poaiService.findOne(+id);
  }

  // Crear un nuevo POAI
  @Post()
  @Roles('admin', 'superadmin', 'planificador')
  async create(@Body() createRequest: PoaiRequest, @Req() req: Request): Promise<PoaiResponse> {
    try {
      const userId = req.user?.['id'];
      const poai = await this.poaiService.create(createRequest, userId);

      return {
        status: true,
        message: 'POAI creado correctamente',
        data: poai
      };
    } catch (error) {
      return {
        status: false,
        message: 'Error al crear POAI',
        error: error.message
      };
    }
  }

  // Actualizar un POAI
  @Patch(':id')
  @Roles('admin', 'superadmin', 'planificador')
  async update(
    @Param('id') id: string,
    @Body() updateRequest: PoaiUpdateRequest,
  ): Promise<PoaiResponse> {
    return await this.poaiService.update(+id, updateRequest);
  }

  // Eliminar un POAI
  @Delete(':id')
  @Roles('admin', 'superadmin')
  async delete(@Param('id') id: string): Promise<PoaiResponse> {
    return await this.poaiService.delete(+id);
  }
}
