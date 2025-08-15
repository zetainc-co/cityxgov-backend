import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Delete,
  Patch,
  UsePipes,
} from '@nestjs/common';
import { ProgramaService } from './programa.service';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { PlanIndicativoAuditoriaService } from '../plan_indicativo_auditoria/plan_indicativo_auditoria.service';
import { ProgramaRequest } from './dto/programa.dto';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { ValidateProgramaPipe } from './pipes/programa.pipe';

@Controller('programa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramaController {
  constructor(
    private readonly programaService: ProgramaService,
    private readonly auditoriaService: PlanIndicativoAuditoriaService,
  ) {}

  @Get()
  @Roles('superadmin', 'admin')
  findAll() {
    return this.programaService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateProgramaPipe)
  findById(@Param('id') id: number) {
    return this.programaService.findOne(Number(id));
  }

  @Post()
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateProgramaPipe)
  async create(@Body() createProgramaRequest: ProgramaRequest, @Req() req: Request) {
    const result = await this.programaService.create(createProgramaRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'programa', 'INSERT');
    return result;
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateProgramaPipe)
  async update(
    @Param('id') id: number,
    @Body() createProgramaRequest: ProgramaRequest,
    @Req() req: Request,
  ) {
    const result = await this.programaService.update(id, createProgramaRequest);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'programa', 'UPDATE');
    return result;
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateProgramaPipe)
  async delete(@Param('id') id: number, @Req() req: Request) {
    const result = await this.programaService.delete(id);
    const user = (req as any).user;
    await this.auditoriaService.capturarSnapshot(user?.id ?? null, 'programa', 'DELETE');
    return result;
  }
}
