import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserRequest } from 'src/types/user.type';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { ValidateUserPipe } from 'src/common/pipe/users.pipe';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  // @Roles('superadmin')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(ValidateUserPipe)
  create(@Body() createRequest: CreateUserRequest) {
    return this.usersService.create(createRequest);
  }

  @Get()
  @Roles('admin', 'superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateUserStatus(@Param('id') id: number) {
    return this.usersService.updateUserStatus(id);
  }

  @Patch(':identification/role')
  @Roles('superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateRole(
    @Param('identification', ParseIntPipe) identification: number,
    @Body('role') role: string,
    @Req() req,
  ) {
    return this.usersService.updateUserRole(identification, role, req.user);
  }
}
