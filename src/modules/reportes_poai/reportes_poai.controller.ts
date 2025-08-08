import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportesPoaiService } from './reportes_poai.service';
import { ReportePeriodoRequest, ReportesFiltrosRequest, GenerarReporteExcelRequest } from './dto/reportes-poai.dto';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('reportes-poai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesPoaiController {
  constructor(private readonly reportesPoaiService: ReportesPoaiService) {}

  // Generar reporte de periodo POAI
  @Post('generar-reporte-periodo')
  @Roles('superadmin', 'admin')
  async generarReportePeriodo(@Body() request: ReportePeriodoRequest) {
    return await this.reportesPoaiService.generarReportePeriodo(
      request.año,
      request.usuario_id,
    );
  }

  // Obtener historial de reportes por periodo
  @Get('historial-reportes/:año')
  @Roles('superadmin', 'admin')
  async getHistorialReportes(@Param('año') año: string) {
    return await this.reportesPoaiService.getHistorialReportes(+año);
  }

  // Obtener reporte específico por ID
  @Get('reporte/:id')
  @Roles('superadmin', 'admin')
  async getReporteById(@Param('id') id: string) {
    return await this.reportesPoaiService.getReporteById(+id);
  }

  // Obtener todos los reportes
  @Get('reportes')
  @Roles('superadmin', 'admin')
  async getAllReportes() {
    return await this.reportesPoaiService.getAllReportes();
  }

  // Obtener reportes con filtros
  @Post('reportes-filtrados')
  @Roles('superadmin', 'admin')
  async getReportesFiltrados(@Body() filtros: ReportesFiltrosRequest) {
    return await this.reportesPoaiService.getReportesFiltrados(filtros);
  }

  // Obtener todos los historiales disponibles
  @Get('historiales-disponibles')
  @Roles('superadmin', 'admin')
  async getHistorialesDisponibles() {
    return await this.reportesPoaiService.getHistorialesDisponibles();
  }

  @Get(':historialId/excel')
  @Roles('superadmin', 'admin')
  async descargarReporte(
    @Param('historialId', ParseIntPipe) historialId: number,
    @Res() res: Response
  ) {
    try {
      const excelBuffer = await this.reportesPoaiService.generarReportePoai(historialId);

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=reporte_poai_${historialId}.xlsx`,
        'Content-Length': excelBuffer.length.toString(),
      });

      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        message: 'Error generando reporte',
        error: error.message
      });
    }
  }

  @Get(':historialId/preview')
  @Roles('superadmin', 'admin')
  async previsualizarDatos(
    @Param('historialId', ParseIntPipe) historialId: number
  ) {
    try {
      const previewData = await this.reportesPoaiService.getPreviewData(historialId);
      return previewData;
    } catch (error) {
      throw new Error(`Error en previsualización: ${error.message}`);
    }
  }




}
