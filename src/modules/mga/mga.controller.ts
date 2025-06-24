import {
    Controller,
    Post,
    Get,
    Param,
    Delete,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    ParseIntPipe,
    UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MgaService } from './mga.service';
import { Express } from 'express';
import { Roles } from 'src/modules/rol/decorator/roles.decorator'
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';

@Controller('mga')
@Roles('admin', 'superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MgaController {
    constructor(private readonly mgaService: MgaService) { }

    @Post('upload-excel')
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcel(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado ningún archivo');
        }

        // Validar que sea un archivo Excel
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('El archivo debe ser un Excel (.xlsx o .xls)');
        }

        return await this.mgaService.processExcelFile(file.buffer);
    }

    @Get()
    async findAll() {
        return await this.mgaService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        return await this.mgaService.findOne(id);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        await this.mgaService.delete(id);
        return { message: 'Registro MGA eliminado exitosamente' };
    }
}
