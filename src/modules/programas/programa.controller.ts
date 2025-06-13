import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ProgramaService } from './programa.service';
import { CreateProgramaRequest } from './types/programa';

import { Roles } from 'src/modules/rol/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/modules/rol/guard/roles.guard';

@Controller('programa')
export class ProgramaController {
    constructor(private readonly programaService: ProgramaService) { }

    @Get()
    @Roles('superadmin', 'admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAll() {
        return this.programaService.findAll();
    }

    @Get(':id')
    @Roles('superadmin', 'admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    findById(@Param('id') id: number) {
        return this.programaService.findById(Number(id));
    }

    @Post()
    @Roles('superadmin', 'admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() createProgramaRequest: CreateProgramaRequest) {
        return this.programaService.create(createProgramaRequest);
    }
}
