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
import { FuentesFinanciacionRequest } from './dto/fuentes_financiacion';
import { FuentesFinanciacionService } from './fuentes_financiacion.service';
import { CreateFuentesFinanciacionPipe, ValidateIdPipe } from './pipes/fuentes_financiacion.pipe';

@Controller('fuentes-financiacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FuentesFinanciacionController {
    constructor(private readonly fuentesFinanciacionService: FuentesFinanciacionService) {}

    //Obtiene todas las fuentes de financiación
    @Get()
    @Roles('superadmin', 'admin')
    async findAll() {
        return this.fuentesFinanciacionService.findAll();
    }

    //Obtiene una fuente de financiación por su id
    @Get(':id')
    @Roles('superadmin', 'admin')
    async findOne(@Param('id', ValidateIdPipe) id: number) {
        return this.fuentesFinanciacionService.findOne(id);
    }

    //Crea una nueva fuente de financiación
    @Post()
    @Roles('superadmin', 'admin')
    async create(@Body(CreateFuentesFinanciacionPipe) createRequest: FuentesFinanciacionRequest) {
        return this.fuentesFinanciacionService.create(createRequest);
    }

    //Actualiza una fuente de financiación
    @Patch(':id')
    @Roles('superadmin', 'admin')
    async update(@Param('id', ValidateIdPipe) id: number, @Body(CreateFuentesFinanciacionPipe) updateRequest: FuentesFinanciacionRequest) {
        return this.fuentesFinanciacionService.update(id, updateRequest);
    }

    //Elimina una fuente de financiación
    @Delete(':id')
    @Roles('superadmin', 'admin')
    async delete(@Param('id', ValidateIdPipe) id: number) {
        return this.fuentesFinanciacionService.delete(id);
    }
}   

