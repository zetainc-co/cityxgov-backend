import {
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Controller,
  Query,
} from '@nestjs/common';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PoaiRequest, PoaiUpdateRequest, PoaiUpdateWithTraceabilityRequest } from './dto/poai.dto';
import { PoaiService } from './poai.service';

@Controller('poai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoaiController {
  constructor(private readonly poaiService: PoaiService) {}

  // Obtener POAI completo por año con todas las relaciones
  @Get('year/:año')
  @Roles('superadmin', 'admin')
  async getPoaiCompletoByYear(@Param('año') año: string) {
    return await this.poaiService.getPoaiCompletoByYear(+año);
  }

  // Actualizar POAI completo con trazabilidad
  @Post('update-with-traceability')
  @Roles('superadmin', 'admin')
  async updatePoaiWithTraceability(@Body() updateRequest: PoaiUpdateWithTraceabilityRequest) {
    return await this.poaiService.updatePoaiWithTraceability(
      updateRequest.año,
      updateRequest.usuario_id,
      updateRequest.cambios
    );
  }

  // Obtener historial de cambios por año específico
  @Get('historial/:año')
  @Roles('superadmin', 'admin')
  async getHistorialCambios(
    @Param('año') año: string,
    @Query('tipo_cambio') tipoCambio?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return await this.poaiService.getHistorialCambios(
      +año,
      tipoCambio,
      fechaDesde,
      fechaHasta,
      limit ? +limit : 50,
      offset ? +offset : 0
    );
  }

  // Obtener todo el historial de cambios (sin año específico)
  @Get('historial')
  @Roles('superadmin', 'admin')
  async getAllHistorialCambios(
    @Query('tipo_cambio') tipoCambio?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return await this.poaiService.getAllHistorialCambios(
      tipoCambio,
      fechaDesde,
      fechaHasta,
      limit ? +limit : 50,
      offset ? +offset : 0
    );
  }

  // Generar reporte de cambios por año específico
  @Get('reporte/:año')
  @Roles('superadmin', 'admin')
  async generarReporteCambios(@Param('año') año: string) {
    return await this.poaiService.generarReporteCambios(+año);
  }

  // Generar reporte general de cambios (sin año específico)
  @Get('reporte')
  @Roles('superadmin', 'admin')
  async generarReporteGeneralCambios() {
    return await this.poaiService.generarReporteGeneralCambios();
  }

  // Obtener todos los POAIs
  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return await this.poaiService.findAll();
  }

  // Obtener un POAI por ID
  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.poaiService.findOne(+id);
  }

  // Crear POAI
  @Post()
  @Roles('superadmin', 'admin')
  async create(@Body() createRequest: PoaiRequest) {
    return await this.poaiService.create(createRequest);
  }

  // Actualizar POAI
  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id') id: string,
    @Body() updateRequest: PoaiUpdateRequest
  ) {
    return await this.poaiService.update(+id, updateRequest);
  }

  // Eliminar POAI
  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id') id: string) {
    return await this.poaiService.delete(+id);
  }
}
