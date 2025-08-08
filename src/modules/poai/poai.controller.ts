import {
  Get,
  Param,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PoaiService } from './poai.service';
import { PoaiResponse } from './dto/poai.dto';

@Controller('poai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoaiController {
  constructor(private readonly poaiService: PoaiService) { }

  // Obtener POAI completo por año con todas las relaciones
  @Get('year/:año')
  @Roles('superadmin', 'admin')
  async getPoaiCompletoByYear(@Param('año', ParseIntPipe) año: number) {
    return await this.poaiService.getPoaiCompletoByYear(año);
  }
}
