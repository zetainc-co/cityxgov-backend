import {
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Controller,
  UseGuards,
  Query,
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

  // Crear banco de proyectos
  @Post()
  @Roles('superadmin', 'admin')
  async create(@Body() createRequest: BancoProyectosRequest) {
    return await this.bancoProyectosService.create(createRequest);
  }

  // Obtener todos los bancos de proyectos (con filtro opcional por año)
  @Get()
  @Roles('superadmin', 'admin')
  async findAll(@Query('año') año?: string) {
    const añoNumber = año ? +año : undefined;
    return await this.bancoProyectosService.findAll(añoNumber);
  }

  // Obtener proyectos por año específico
  @Get('year/:año')
  @Roles('superadmin', 'admin')
  async findByYear(@Param('año') año: string) {
    return await this.bancoProyectosService.findByYear(+año);
  }

  // Obtener proyectos por año específico con relaciones
  @Get('year/:año/with-relations')
  @Roles('superadmin', 'admin')
  async findByYearWithRelations(@Param('año') año: string) {
    return await this.bancoProyectosService.findByYearWithRelations(+año);
  }

  // Obtener un banco de proyectos por id
  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.bancoProyectosService.findOne(+id);
  }

  // Actualizar un banco de proyectos
  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateRequest: BancoProyectosRequest
  ) {
    return await this.bancoProyectosService.update(+id, updateRequest);
  }

  // Eliminar un banco de proyectos
  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id') id: string) {
    return await this.bancoProyectosService.delete(+id);
  }
}
