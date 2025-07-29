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
  UpdateMultipleProgramacionFisicaPipe,
} from './pipes/programacion_fisica.pipe';

@Controller('programacion-fisica')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramacionFisicaController {
  constructor(
    private readonly programacionFisicaService: ProgramacionFisicaService,
  ) {}

  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return this.programacionFisicaService.findAll();
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
  ) {
    return this.programacionFisicaService.create(createRequest);
  }

  // Actualiza múltiples programaciones físicas POAI
  @Patch('update-multiple')
  @Roles('superadmin', 'admin')
  async updateMultiple(
    @Body(UpdateMultipleProgramacionFisicaPipe)
    requests: ProgramacionFisicaRequest[],
  ) {
    return this.programacionFisicaService.updateMultiple(requests);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id', ValidateIdPipe) id: number,
    @Body(CreateProgramacionFisicaPipe)
    updateRequest: ProgramacionFisicaRequest,
  ) {
    return this.programacionFisicaService.update(id, updateRequest);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id', ValidateIdPipe) id: number) {
    return this.programacionFisicaService.delete(id);
  }
}
