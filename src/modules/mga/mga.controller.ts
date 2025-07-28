import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MgaService } from './mga.service';
import { UpdateMgaDto } from './dto/mga.dto';
import { Express } from 'express';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';

@Controller('mga')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MgaController {
  constructor(private readonly mgaService: MgaService) {}

  @Post('upload-excel')
  @Roles('admin', 'superadmin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB límite de archivo
        files: 1,
      },
    }),
  )
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    return await this.mgaService.uploadExcel(file);
  }

  @Get()
  @Roles('admin', 'superadmin')
  async findAll() {
    const result = await this.mgaService.findAllWithoutPagination();
    return result;
  }

  @Get('paginated')
  @Roles('admin', 'superadmin', 'user')
  async findAllPaginated(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const result = await this.mgaService.findAll(pageNum, limitNum);
    return result;
  }

  @Get('search')
  @Roles('admin', 'superadmin')
  async searchMga(
    @Query('q') searchTerm: string = '',
    @Query('limit') limit: string = '50',
  ) {
    const limitNum = parseInt(limit) || 50;
    const result = await this.mgaService.searchMga(searchTerm, limitNum);
    return result;
  }

  @Get(':id')
  @Roles('admin', 'superadmin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.mgaService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'superadmin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMgaDto: UpdateMgaDto,
  ) {
    return await this.mgaService.update(id, updateMgaDto);
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.mgaService.delete(id);
  }
}
