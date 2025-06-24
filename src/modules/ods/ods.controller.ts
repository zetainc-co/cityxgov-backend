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
import { OdsRequest } from './dto/ods.dto';
import { OdsService } from './ods.service';
import { CreateOdsPipe, ValidateIdPipe } from './pipes/ods.pipe';
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('ods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OdsController {
  constructor(private readonly odsService: OdsService) {}

  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return await this.odsService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id', ValidateIdPipe) id: number) {
    return await this.odsService.findOne(id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  async create(@Body(CreateOdsPipe) createRequest: OdsRequest) {
    return await this.odsService.create(createRequest);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id', ValidateIdPipe) id: number,
    @Body(CreateOdsPipe) updateRequest: OdsRequest,
  ) {
    return await this.odsService.update(id, updateRequest);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id', ValidateIdPipe) id: number) {
    return await this.odsService.delete(id);
  }
}
