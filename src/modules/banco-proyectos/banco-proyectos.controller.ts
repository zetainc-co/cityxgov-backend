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

  //crear banco de proyectos
  @Post()
  @Roles('superadmin', 'admin')
  async create(@Body() createRequest: BancoProyectosRequest) {
    return await this.bancoProyectosService.create(createRequest);
  }

  //obtener todos los bancos de proyectos
  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return await this.bancoProyectosService.findAll();
  }

  //obtener un banco de proyectos por id
  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.bancoProyectosService.findOne(+id);
  }

  //obtener un banco de proyectos con sus relaciones
  @Get(':id/relations')
  @Roles('superadmin', 'admin')
  async findOneWithRelations(@Param('id') id: string) {
    return await this.bancoProyectosService.findOneWithRelations(+id);
  }

  //actualizar un banco de proyectos
  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateRequest: BancoProyectosRequest
  ) {
    return await this.bancoProyectosService.update(+id, updateRequest);
  }

  //eliminar un banco de proyectos
  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id') id: string) {
    return await this.bancoProyectosService.delete(+id);
  }
}
