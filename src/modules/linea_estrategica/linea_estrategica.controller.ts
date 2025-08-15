import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Delete,
  UsePipes,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { LineaEstrategicaService } from './linea_estrategica.service';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { PlanIndicativoAuditoriaService } from '../plan_indicativo_auditoria/plan_indicativo_auditoria.service';
import { LineaEstrategicaRequest } from './dto/linea_estrategica.dto';
import { ValidateLineaEstrategicaPipe } from './pipes/linea_estrategica.pipe';

@Controller('linea-estrategica')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LineaEstrategicaController {
  constructor(
    private readonly lineaEstrategicaService: LineaEstrategicaService,
    private readonly auditoriaService: PlanIndicativoAuditoriaService,
  ) {}

  @Get()
  @Roles('superadmin', 'admin')
  findAll() {
    return this.lineaEstrategicaService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateLineaEstrategicaPipe)
  findOne(@Param('id') id: number) {
    return this.lineaEstrategicaService.findOne(id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateLineaEstrategicaPipe)
  async create(@Body() createRequest: LineaEstrategicaRequest, @Req() req: Request) {
    const result = await this.lineaEstrategicaService.create(createRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'linea_estrategica', 'INSERT');
    return result;
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateLineaEstrategicaPipe)
  async update(
    @Param('id') id: number,
    @Body() createRequest: LineaEstrategicaRequest,
    @Req() req: Request,
  ) {
    const result = await this.lineaEstrategicaService.update(id, createRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'linea_estrategica', 'UPDATE');
    return result;
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateLineaEstrategicaPipe)
  async delete(@Param('id') id: number, @Req() req: Request) {
    const result = await this.lineaEstrategicaService.delete(id);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'linea_estrategica', 'DELETE');
    return result;
  }
}
