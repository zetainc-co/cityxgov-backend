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
import { ProgramaRequest } from './dto/programa.dto';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { ValidateProgramaPipe } from './pipes/programa.pipe';

@Controller('programa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramaController {
  constructor(private readonly programaService: ProgramaService) {}

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
  create(@Body() createProgramaRequest: ProgramaRequest) {
    return this.programaService.create(createProgramaRequest);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateProgramaPipe)
  update(
    @Param('id') id: number,
    @Body() createProgramaRequest: ProgramaRequest,
  ) {
    return this.programaService.update(id, createProgramaRequest);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateProgramaPipe)
  delete(@Param('id') id: number) {
    return this.programaService.delete(id);
  }
}
