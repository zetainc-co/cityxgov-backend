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
import { FinanciacionPeriodoRequest } from './dto/financiacion_periodo.dto';
import { FinanciacionPeriodoService } from './financiacion_periodo.service';
import { CreateFinanciacionPeriodoPipe, ValidateIdPipe } from './pipes/financiacion_periodo.pipe';

@Controller('financiacion-periodo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanciacionPeriodoController {
    constructor(private readonly financiacionPeriodoService: FinanciacionPeriodoService) {}

    // Obtiene todas las financiaciones por periodo
    @Get()
    @Roles('superadmin', 'admin')
    async findAll() {
        return this.financiacionPeriodoService.findAll();
    }

    // Obtiene una financiación por periodo por su id
    @Get(':id')
    @Roles('superadmin', 'admin')
    async findOne(@Param('id', ValidateIdPipe) id: number) {
        return this.financiacionPeriodoService.findOne(id);
    }

    // Crea una nueva financiación por periodo
    @Post()
    @Roles('superadmin', 'admin')
    async create(
        @Body(CreateFinanciacionPeriodoPipe) createRequest: FinanciacionPeriodoRequest
    ) {
        return this.financiacionPeriodoService.create(createRequest);
    }

    // Actualiza una financiación por periodo
    @Patch(':id')
    @Roles('superadmin', 'admin')
    async update(
        @Param('id', ValidateIdPipe) id: number, 
        @Body(CreateFinanciacionPeriodoPipe) updateRequest: FinanciacionPeriodoRequest
    ) {
        return this.financiacionPeriodoService.update(id, updateRequest);
    }

    // Elimina una financiación por periodo
    @Delete(':id')
    @Roles('superadmin', 'admin')
    async delete(@Param('id', ValidateIdPipe) id: number) {
        return this.financiacionPeriodoService.delete(id);
    }
} 