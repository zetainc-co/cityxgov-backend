import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { MetaResultadoService } from './meta_resultado.service';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { PlanIndicativoAuditoriaService } from '../plan_indicativo_auditoria/plan_indicativo_auditoria.service';
import { MetaResultadoRequest } from './dto/meta_resultado.dto';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { ValidateMetaResultadoPipe } from './pipes/meta_resultado.pipe';

@Controller('meta-resultado')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetaResultadoController {
  constructor(
    private readonly metaResultadoService: MetaResultadoService,
    private readonly auditoriaService: PlanIndicativoAuditoriaService,
  ) {}

  @Get()
  @Roles('superadmin', 'admin')
  findAll() {
    return this.metaResultadoService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateMetaResultadoPipe)
  findOne(@Param('id') id: number) {
    return this.metaResultadoService.findOne(Number(id));
  }

  @Post()
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateMetaResultadoPipe)
  async create(@Body() createMetaResultadoRequest: MetaResultadoRequest, @Req() req: Request) {
    const result = await this.metaResultadoService.create(createMetaResultadoRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'meta_resultado', 'INSERT');
    return result;
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateMetaResultadoPipe)
  async update(
    @Param('id') id: number,
    @Body() updateMetaResultadoRequest: MetaResultadoRequest,
    @Req() req: Request,
  ) {
    const result = await this.metaResultadoService.update(id, updateMetaResultadoRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'meta_resultado', 'UPDATE');
    return result;
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateMetaResultadoPipe)
  async delete(@Param('id') id: number, @Req() req: Request) {
    const result = await this.metaResultadoService.delete(id);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'meta_resultado', 'DELETE');
    return result;
  }
}
