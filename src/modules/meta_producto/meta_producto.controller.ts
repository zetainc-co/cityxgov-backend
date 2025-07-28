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
import { RolesGuard } from '../rol/guard/roles.guard';
import { Roles } from '../rol/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { MetaProductoRequest } from './dto/meta_producto.dto';
import { MetaProductoService } from './meta_producto.service';
import {
  CreateMetaProductoPipe,
  ValidateIdPipe,
} from './pipes/meta_producto.pipe';

@Controller('meta-producto')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetaProductoController {
  constructor(private readonly metaProductoService: MetaProductoService) {}

  @Get()
  @Roles('superadmin', 'admin')
  async findAll() {
    return await this.metaProductoService.findAll();
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  async findOne(@Param('id', ValidateIdPipe) id: number) {
    return await this.metaProductoService.findOne(id);
  }

  @Post()
  @Roles('superadmin', 'admin')
  async create(
    @Body(CreateMetaProductoPipe) createRequest: MetaProductoRequest,
  ) {
    return await this.metaProductoService.create(createRequest);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin')
  async update(
    @Param('id', ValidateIdPipe) id: number,
    @Body(CreateMetaProductoPipe) updateRequest: MetaProductoRequest,
  ) {
    return await this.metaProductoService.update(id, updateRequest);
  }

  @Delete(':id')
  @Roles('superadmin', 'admin')
  async delete(@Param('id', ValidateIdPipe) id: number) {
    return await this.metaProductoService.delete(id);
  }
}
