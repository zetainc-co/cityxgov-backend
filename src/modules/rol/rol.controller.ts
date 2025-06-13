import {
    Get,
    Put,
    Body,
    Post,
    Param,
    Delete,
    UsePipes,
    UseGuards,
    Controller,
} from '@nestjs/common';
import { RolService } from './rol.service';
import { ValidateRole } from './pipes/rol.pipe';
import { CreateRoleRequest } from './dto/rol.dto';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';
import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';

@Controller('rol')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolController {

    constructor(private readonly rolService: RolService) {}

    @Get()
    @Roles('admin', 'superadmin')
    findAll() {
        return this.rolService.findAll();
    }

    @Get(':id')
    @Roles('admin', 'superadmin')
    @UsePipes(ValidateRole)
    findOne(@Param('id') id: number) {
        return this.rolService.findOne(id);
    }

    @Post()
    @Roles('superadmin')
    @UsePipes(ValidateRole)
    create(@Body() createRequest: CreateRoleRequest) {
        return this.rolService.create(createRequest);
    }

    @Put(':id')
    @Roles('superadmin')
    @UsePipes(ValidateRole)
    update(
        @Param('id') id: number,
        @Body() updateRoleRequest: CreateRoleRequest
    ) {
        return this.rolService.update(id, updateRoleRequest);
    }

    @Delete(':id')
    @Roles('superadmin')
    @UsePipes(ValidateRole)
    delete(@Param('id') id: number) {
        return this.rolService.delete(id);
    }
}
