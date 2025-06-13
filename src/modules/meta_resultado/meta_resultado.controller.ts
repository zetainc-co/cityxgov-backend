import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { MetaResultadoService } from './meta_resultado.service';
import { CreateMetaResultadoRequest } from './types/meta_resultado';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';

@Controller('meta-resultado')
export class MetaResultadoController {
  constructor(private readonly metaResultadoService: MetaResultadoService) {}

  @Get()
  @Roles('superadmin', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.metaResultadoService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findById(@Param('id') id: number) {
    return this.metaResultadoService.findById(Number(id));
  }

  @Post()
  @Roles('superadmin', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() createMetaResultadoRequest: CreateMetaResultadoRequest) {
    return this.metaResultadoService.create(createMetaResultadoRequest);
  }
}
