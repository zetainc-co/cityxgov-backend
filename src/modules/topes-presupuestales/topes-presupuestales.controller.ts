import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { TopesPresupuestalesService } from './topes-presupuestales.service';
import { TopesPresupuestalesRequest } from './dto/topes-presupuestales.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';

@Controller('topes-presupuestales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopesPresupuestalesController {
  constructor(private readonly topesPresupuestalesService: TopesPresupuestalesService) {}

  //crear tope presupuestal
  @Post()
  @Roles('superadmin', 'admin')
  async create(@Body() createRequest: TopesPresupuestalesRequest) {
    return await this.topesPresupuestalesService.create(createRequest);
  }

  //obtener todos los topes presupuestales
  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return await this.topesPresupuestalesService.findAll();
  }

  @Get('año/:año')
  @Roles('superadmin', 'admin')
  async findByAño(@Param('año') año: string) {
    return await this.topesPresupuestalesService.findByAño(+año);
  }

  @Get('fuentes/:año')
  @Roles('superadmin', 'admin')
  async getFuentesConTopes(@Param('año') año: string) {
    return await this.topesPresupuestalesService.getFuentesConTopes(+año);
  }

  //obtener un tope presupuestal por id
  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.topesPresupuestalesService.findOne(+id);
  }

  //actualizar un tope presupuestal
  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateRequest: TopesPresupuestalesRequest
  ) {
    return await this.topesPresupuestalesService.update(+id, updateRequest);
  }

  //eliminar un tope presupuestal
  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id') id: string) {
    return await this.topesPresupuestalesService.delete(+id);
  }


}
