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
import { ProgramacionFisicaRequest } from './dto/programacion_fisica.dto';
import { ProgramacionFisicaService } from './programacion_fisica.service';
import {
  CreateProgramacionFisicaPipe,
  ValidateIdPipe,
  ValidatePeriodoPipe,
  UpdateMultipleProgramacionFisicaPipe,
} from './pipes/programacion_fisica.pipe';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { PlanIndicativoAuditoriaService } from '../plan_indicativo_auditoria/plan_indicativo_auditoria.service';

@Controller('programacion-fisica')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramacionFisicaController {
  constructor(
    private readonly programacionFisicaService: ProgramacionFisicaService,
    private readonly auditoriaService: PlanIndicativoAuditoriaService,
  ) {}

  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return this.programacionFisicaService.findAll();
  }

  @Get('periodo/:periodo')
  @Roles('superadmin', 'admin')
  async findByPeriodo(@Param('periodo', ValidatePeriodoPipe) periodo: number) {
    return this.programacionFisicaService.findByPeriodo(periodo);
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id', ValidateIdPipe) id: number) {
    return this.programacionFisicaService.findOne(id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  async create(
    @Body(CreateProgramacionFisicaPipe)
    createRequest: ProgramacionFisicaRequest,
    @Req() req: Request,
  ) {
    const result = await this.programacionFisicaService.create(createRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'programacion_fisica', 'INSERT');
    return result;
  }

  // Actualiza programaciones físicas por periodo específico
  @Patch('update-periodo/:periodo')
  @Roles('superadmin', 'admin')
  async updatePeriodo(
    @Param('periodo', ValidatePeriodoPipe) periodo: number,
    @Body(UpdateMultipleProgramacionFisicaPipe)
    requests: ProgramacionFisicaRequest[],
    @Req() req: Request,
  ) {
    const result = await this.programacionFisicaService.updatePeriodo(periodo, requests);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'programacion_fisica', 'UPDATE');
    return result;
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id', ValidateIdPipe) id: number,
    @Body(CreateProgramacionFisicaPipe)
    updateRequest: ProgramacionFisicaRequest,
    @Req() req: Request,
  ) {
    const result = await this.programacionFisicaService.update(id, updateRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'programacion_fisica', 'UPDATE');
    return result;
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id', ValidateIdPipe) id: number, @Req() req: Request) {
    const result = await this.programacionFisicaService.delete(id);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'programacion_fisica', 'DELETE');
    return result;
  }
}
