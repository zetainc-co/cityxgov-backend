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
    UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MgaService } from './mga.service';
import { UpdateMgaDto } from './dto/mga.dto';
import { Express } from 'express';
import { Roles } from 'src/modules/rol/decorator/roles.decorator'
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';

@Controller('mga')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MgaController {
    constructor(private readonly mgaService: MgaService) { }

    @Post('upload-excel')
    @Roles('admin', 'superadmin')
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcel(@UploadedFile() file: Express.Multer.File) {
        return await this.mgaService.uploadExcel(file);
    }

    @Get()
    @Roles('admin', 'superadmin')
    async findAll() {
        return await this.mgaService.findAll();
    }

    @Get(':id')
    @Roles('admin', 'superadmin')
    async findOne(@Param('id') id: number) {
        return await this.mgaService.findOne(id);
    }

    @Patch(':id')
    @Roles('admin', 'superadmin')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateMgaDto: UpdateMgaDto
    ) {
        return await this.mgaService.update(id, updateMgaDto);
    }

    @Delete(':id')
    @Roles('admin', 'superadmin')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return await this.mgaService.delete(id);
    }
}
