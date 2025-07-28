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
import { LineaEstrategicaRequest } from './dto/linea_estrategica.dto';
import { ValidateLineaEstrategicaPipe } from './pipes/linea_estrategica.pipe';

@Controller('linea-estrategica')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LineaEstrategicaController {
  constructor(
    private readonly lineaEstrategicaService: LineaEstrategicaService,
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
  create(@Body() createRequest: LineaEstrategicaRequest) {
    return this.lineaEstrategicaService.create(createRequest);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateLineaEstrategicaPipe)
  update(
    @Param('id') id: number,
    @Body() createRequest: LineaEstrategicaRequest,
  ) {
    return this.lineaEstrategicaService.update(id, createRequest);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  @UsePipes(ValidateLineaEstrategicaPipe)
  delete(@Param('id') id: number) {
    return this.lineaEstrategicaService.delete(id);
  }
}
