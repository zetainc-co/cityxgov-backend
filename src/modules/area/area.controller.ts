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
import { AreaService } from './area.service';
import { AreaRequest } from './dto/area.dto';
import { ValidateAreaPipe } from './pipe/area.pipe';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';

@Controller('area')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AreaController {

    constructor(private readonly areaService: AreaService) {}

    @Get()
    @Roles('superadmin', 'admin' )
    findAll() {
        return this.areaService.findAll();
    }

    @Get(':id')
    @Roles('superadmin', 'admin')
    @UsePipes(ValidateAreaPipe)
    findOne(@Param('id') id: number) {
        return this.areaService.findOne(id);
    }

    @Post()
    @Roles('superadmin')
    @UsePipes(ValidateAreaPipe)
    create(@Body() createRequest: AreaRequest) {
        return this.areaService.create(createRequest);
    }

    @Patch(':id')
    @Roles('superadmin')
    @UsePipes(ValidateAreaPipe)
    update(
        @Param('id') id: number,
        @Body() updateAreaRequest: AreaRequest) {
        return this.areaService.update(id, updateAreaRequest);
    }

    @Delete(':id')
    @Roles('superadmin')
    @UsePipes(ValidateAreaPipe)
    delete(@Param('id') id: number) {
        return this.areaService.delete(id);
    }
}
