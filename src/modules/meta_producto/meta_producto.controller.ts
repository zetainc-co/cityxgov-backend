import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { MetaProductoRequest } from './dto/meta_producto.dto';
import { MetaProductoService } from './meta_producto.service';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { PlanIndicativoAuditoriaService } from '../plan_indicativo_auditoria/plan_indicativo_auditoria.service';
import {
  CreateMetaProductoPipe,
  ValidateIdPipe,
} from './pipes/meta_producto.pipe';

@Controller('meta-producto')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetaProductoController {
  constructor(
    private readonly metaProductoService: MetaProductoService,
    private readonly auditoriaService: PlanIndicativoAuditoriaService,
  ) {}

  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return await this.metaProductoService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id', ValidateIdPipe) id: number) {
    return await this.metaProductoService.findOne(id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  async create(
    @Body(CreateMetaProductoPipe) createRequest: MetaProductoRequest,
    @Req() req: Request,
  ) {
    const result = await this.metaProductoService.create(createRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'meta_producto', 'INSERT');
    return result;
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id', ValidateIdPipe) id: number,
    @Body(CreateMetaProductoPipe) updateRequest: MetaProductoRequest,
    @Req() req: Request,
  ) {
    const result = await this.metaProductoService.update(id, updateRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'meta_producto', 'UPDATE');
    return result;
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id', ValidateIdPipe) id: number, @Req() req: Request) {
    const result = await this.metaProductoService.delete(id);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'meta_producto', 'DELETE');
    return result;
  }
}
