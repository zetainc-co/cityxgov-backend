import {
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { TopesPresupuestalesRequest } from './dto/topes-presupuestales.dto';
import { TopesPresupuestalesService } from './topes-presupuestales.service';

@Controller('topes-presupuestales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopesPresupuestalesController {
  constructor(private readonly topesPresupuestalesService: TopesPresupuestalesService) {}

  // Obtener topes por periodo específico con relaciones
  @Get('periodo/:periodo')
  @Roles('superadmin', 'admin')
  async findByPeriodo(@Param('periodo') periodo: string) {
    return await this.topesPresupuestalesService.findByPeriodo(+periodo);
  }

  // Obtener un tope presupuestal por ID con relaciones
  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.topesPresupuestalesService.findOne(+id);
  }

  // Crear nuevo tope presupuestal
  @Post()
  @Roles('superadmin', 'admin')
  async create(@Body() createRequest: TopesPresupuestalesRequest) {
    return await this.topesPresupuestalesService.create(createRequest);
  }

  // Actualizar tope presupuestal
  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateRequest: TopesPresupuestalesRequest
  ) {
    return await this.topesPresupuestalesService.update(+id, updateRequest);
  }

  // Eliminar tope presupuestal
  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id') id: string) {
    return await this.topesPresupuestalesService.delete(+id);
  }
}
