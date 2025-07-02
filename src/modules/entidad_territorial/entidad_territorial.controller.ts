import {
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    UsePipes,
    UseGuards,
    Controller,
} from '@nestjs/common';
import { EntidadTerritorialService } from './entidad_territorial.service';
import { EntidadTerritorialRequest } from './dto/entidad_territorial.dto';
import { ValidateEntidadTerritorialPipe } from './pipes/entidad_territorial.pipe';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';

@Controller('entidad-territorial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EntidadTerritorialController {

    constructor(private readonly entidadTerritorialService: EntidadTerritorialService) {}

    @Get()
    @Roles('superadmin', 'admin')
    getEntidad() {
        return this.entidadTerritorialService.getEntidad();
    }

    @Post()
    @Roles('superadmin', 'admin')
    @UsePipes(ValidateEntidadTerritorialPipe)
    createEntidad(@Body() createRequest: EntidadTerritorialRequest) {
        return this.entidadTerritorialService.createEntidad(createRequest);
    }

    @Patch()
    @Roles('superadmin', 'admin')
    @UsePipes(ValidateEntidadTerritorialPipe)
    updateEntidad(@Body() updateRequest: EntidadTerritorialRequest) {
        return this.entidadTerritorialService.updateEntidad(updateRequest);
    }

    @Delete()
    @Roles('superadmin')
    deleteEntidad() {
        return this.entidadTerritorialService.deleteEntidad();
    }

    @Get('organigrama')
    @Roles('superadmin', 'admin')
    getOrganigrama() {
        return this.entidadTerritorialService.getOrganigrama();
    }

    @Patch('organigrama')
    @Roles('superadmin', 'admin')
    @UsePipes(ValidateEntidadTerritorialPipe)
    updateOrganigrama(@Body() organigrama: any) {
        return this.entidadTerritorialService.updateOrganigrama(organigrama);
    }

    @Delete('organigrama')
    @Roles('superadmin', 'admin')
    deleteOrganigrama() {
        return this.entidadTerritorialService.deleteOrganigrama();
    }

}
