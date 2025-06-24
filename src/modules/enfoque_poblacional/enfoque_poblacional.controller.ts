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
import { EnfoquePoblacionalRequest } from './dto/enfoque_poblacional';
import { EnfoquePoblacionalService } from './enfoque_poblacional.service';
import { CreateEnfoquePoblacionalPipe, ValidateIdPipe } from './pipe/enfoque_poblacional.pipe';

@Controller('enfoque-poblacional')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnfoquePoblacionalController {
    constructor(private readonly enfoquePoblacionalService: EnfoquePoblacionalService) { }

    @Get()
    @Roles('superadmin', 'admin')
    async findAll() {
        return await this.enfoquePoblacionalService.findAll();
    }

    @Get(':id')
    @Roles('superadmin', 'admin')
    async findOne(@Param('id', ValidateIdPipe) id: number) {
        return await this.enfoquePoblacionalService.findOne(id);
    }

    @Post()
    @Roles('superadmin', 'admin')
    async create(
        @Body(CreateEnfoquePoblacionalPipe) createRequest: EnfoquePoblacionalRequest
    ) {
        return await this.enfoquePoblacionalService.create(createRequest);
    }

    @Patch(':id')
    @Roles('superadmin', 'admin')
    async update(
        @Param('id', ValidateIdPipe) id: number, 
        @Body(CreateEnfoquePoblacionalPipe) updateRequest: EnfoquePoblacionalRequest
    ) {
        return await this.enfoquePoblacionalService.update(id, updateRequest);
    }

    @Delete(':id')
    @Roles('superadmin', 'admin')
    async delete(@Param('id', ValidateIdPipe) id: number) {
        return await this.enfoquePoblacionalService.delete(id);
    }
}
