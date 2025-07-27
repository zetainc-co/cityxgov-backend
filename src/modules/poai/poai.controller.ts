import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PoaiService } from './poai.service';
import { PoaiVigenciaRequest } from './dto/poai.dto';

@Controller('poai')
export class PoaiController {
  constructor(private readonly poaiService: PoaiService) {}

  @Post('vigencias')
  async createVigencia(@Body() createRequest: PoaiVigenciaRequest) {
    return await this.poaiService.createVigencia(createRequest);
  }

  @Get('vigencias')
  async findAllVigencias() {
    return await this.poaiService.findAllVigencias();
  }

  @Get('vigencias/:id')
  async findVigenciaById(@Param('id') id: string) {
    return await this.poaiService.findVigenciaById(+id);
  }

  @Get('vigencias/año/:año')
  async findVigenciaByAño(@Param('año') año: string) {
    return await this.poaiService.findVigenciaByAño(+año);
  }

  @Put('vigencias/:id')
  async updateVigencia(
    @Param('id') id: string,
    @Body() updateRequest: PoaiVigenciaRequest
  ) {
    return await this.poaiService.updateVigencia(+id, updateRequest);
  }

  @Delete('vigencias/:id')
  async deleteVigencia(@Param('id') id: string) {
    return await this.poaiService.deleteVigencia(+id);
  }

  @Get('data/:año')
  async getPoaiDataByAño(@Param('año') año: string) {
    return await this.poaiService.getPoaiDataByAño(+año);
  }

  @Put('programacion-financiera')
  async updateProgramacionFinanciera(
    @Body() body: {
      metaId: number;
      fuenteId: number;
      año: number;
      valor: number;
    }
  ) {
    // Validar topes antes de actualizar
    const validationResult = await this.poaiService.validateTopesPresupuestales(
      body.año,
      body.fuenteId,
      body.valor
    );

    if (!validationResult.status) {
      return validationResult;
    }

    return await this.poaiService.updateProgramacionFinanciera(
      body.metaId,
      body.fuenteId,
      body.año,
      body.valor
    );
  }

  @Put('programacion-fisica')
  async updateProgramacionFisica(
    @Body() body: {
      metaId: number;
      año: number;
      valor: number;
    }
  ) {
    return await this.poaiService.updateProgramacionFisica(
      body.metaId,
      body.año,
      body.valor
    );
  }

  @Get('validate-topes')
  async validateTopes(
    @Query('año') año: string,
    @Query('fuenteId') fuenteId: string,
    @Query('valor') valor: string
  ) {
    return await this.poaiService.validateTopesPresupuestales(
      +año,
      +fuenteId,
      +valor
    );
  }
}
