import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { PlanIndicativoAuditoriaService } from 'src/modules/plan_indicativo_auditoria/plan_indicativo_auditoria.service';
import { ListarSnapshotsDto, ObtenerSnapshotDto } from './dto/plan_indicativo_auditoria.dto';

@Controller('plan-indicativo/auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanIndicativoAuditoriaController {
  constructor(
    private readonly auditoriaService: PlanIndicativoAuditoriaService,
  ) {}

  @Get('snapshots')
  @Roles('superadmin', 'admin')
  listarSnapshots(
    @Query('desde') fechaDesde?: string,
    @Query('hasta') fechaHasta?: string,
  ) {
    const dto: ListarSnapshotsDto = { fechaDesde, fechaHasta };
    return this.auditoriaService.listarSnapshots(dto);
  }

  @Get('snapshots/:id')
  @Roles('superadmin', 'admin')
  obtenerSnapshot(@Param('id') id: string) {
    const dto: ObtenerSnapshotDto = { id: Number(id) };
    return this.auditoriaService.obtenerSnapshot(dto.id);
  }

  @Get('snapshots/:id/excel')
  @Roles('superadmin', 'admin')
  async descargarExcel(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.auditoriaService.generarExcelSnapshot(Number(id));
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Reporte-PlanIndicativo-${id}-${timestamp}.xlsx`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.send(buffer);
    } catch (error) {
      console.error('Error generando Excel Plan Indicativo:', error);
      res.status(500).json({ message: 'Error generando reporte', error: (error as any)?.message || String(error) });
    }
  }
}


