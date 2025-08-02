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
import {
  ValidateIdPipe,
  CreateProgramacionFinancieraPipe,
} from './pipes/programacion_financiera.pipe';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { ProgramacionFinancieraRequest } from './dto/programacion_financiera.dto';
import { ProgramacionFinancieraService } from './programacion_financiera.service';

@Controller('programacion-financiera')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramacionFinancieraController {
  constructor(
    private readonly programacionFinancieraService: ProgramacionFinancieraService,
  ) {}

  // Obtiene todas las programaciones financieras
  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return this.programacionFinancieraService.findAll();
  }

  // Obtiene una programacion financiera por su id
  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id', ValidateIdPipe) id: number) {
    return this.programacionFinancieraService.findOne(id);
  }

  // Obtiene programaciones financieras por periodo específico
  @Get('periodo/:periodo')
  @Roles('superadmin', 'admin')
  async findByPeriodo(@Param('periodo') periodo: string) {
    return this.programacionFinancieraService.findByPeriodo(+periodo);
  }

  // Crea una nueva programacion financiera
  @Post()
  @Roles('superadmin', 'admin')
  async create(
    @Body(CreateProgramacionFinancieraPipe)
    createRequest: ProgramacionFinancieraRequest,
  ) {
    return this.programacionFinancieraService.create(createRequest);
  }

  // Actualiza múltiples programaciones financieras POAI
  // @Patch('update-multiple')
  // @Roles('superadmin', 'admin')
  // async updateMultiple(
  //   @Body() requests: ProgramacionFinancieraRequest[],
  // ) {
  //   return this.programacionFinancieraService.updateMultiple(requests);
  // }

  // Actualiza solo un periodo específico para POAI
  @Patch('update-periodo/:periodo')
  @Roles('superadmin', 'admin')
  async updatePeriodo(
    @Param('periodo') periodo: string,
    @Body() requests: ProgramacionFinancieraRequest[],
  ) {
    return this.programacionFinancieraService.updatePeriodo(+periodo, requests);
  }

  // Actualiza una programacion financiera Plan Indicativo
  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id', ValidateIdPipe) id: number,
    @Body(CreateProgramacionFinancieraPipe)
    updateRequest: ProgramacionFinancieraRequest,
  ) {
    return this.programacionFinancieraService.update(id, updateRequest);
  }

  // Elimina una programacion financiera
  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id', ValidateIdPipe) id: number) {
    return this.programacionFinancieraService.delete(id);
  }
}
