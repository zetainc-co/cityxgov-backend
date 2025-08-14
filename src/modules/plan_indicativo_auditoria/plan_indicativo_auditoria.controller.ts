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
    return this.auditoriaService.listarSnapshots({ fechaDesde, fechaHasta });
  }

  @Get('snapshots/:id')
  @Roles('superadmin', 'admin')
  obtenerSnapshot(@Param('id') id: string) {
    return this.auditoriaService.obtenerSnapshot(Number(id));
  }

  @Get('snapshots/:id/excel')
  @Roles('superadmin', 'admin')
  async descargarExcel(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.auditoriaService.generarExcelSnapshot(Number(id));
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=plan_indicativo_snapshot_${id}.xlsx`,
      });
      res.send(buffer);
    } catch (error) {
      console.error('Error generando Excel Plan Indicativo:', error);
      res.status(500).json({ message: 'Error generando reporte', error: (error as any)?.message || String(error) });
    }
  }
}


