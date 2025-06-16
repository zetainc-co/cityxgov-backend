import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    UseGuards,
    Delete,
    Put,
    UsePipes
} from '@nestjs/common';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { MetaResultadoService } from './meta_resultado.service';
import { MetaResultadoRequest } from './dto/meta_resultado.dto';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { ValidateMetaResultadoPipe } from './pipes/meta_resultado.pipe';

@Controller('meta-resultado')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetaResultadoController {
    constructor(private readonly metaResultadoService: MetaResultadoService) { }

    @Get()
    @Roles('superadmin', 'admin')
    findAll() {
        return this.metaResultadoService.findAll();
    }

    @Get(':id')
    @Roles('superadmin', 'admin')
    @UsePipes(ValidateMetaResultadoPipe)
    findOne(@Param('id') id: number) {
        return this.metaResultadoService.findOne(Number(id));
    }

    @Post()
    @Roles('superadmin', 'admin')
    @UsePipes(ValidateMetaResultadoPipe)
    create(@Body() createMetaResultadoRequest: MetaResultadoRequest) {
        return this.metaResultadoService.create(createMetaResultadoRequest);
    }

    @Put(':id')
    @Roles('superadmin', 'admin')
    @UsePipes(ValidateMetaResultadoPipe)
    update(
        @Param('id') id: number,
        @Body() updateMetaResultadoRequest: MetaResultadoRequest
    ) {
        return this.metaResultadoService.update(id, updateMetaResultadoRequest);
    }

    @Delete(':id')
    @Roles('superadmin', 'admin')
    @UsePipes(ValidateMetaResultadoPipe)
    delete(@Param('id') id: number) {
        return this.metaResultadoService.delete(id);
    }
}
