import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { LoginDto } from 'src/types/auth.type';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(ValidationPipe)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @Roles('admin', 'superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async logout(@Req() req) {
    return this.authService.logout(req.user.userId);
  }

  @Post('recovery')
  async passwordRecovery(@Body() body: { email: string }) {
    return this.authService.passwordRecovery(body.email);
  }

  @Post('validate-otp')
  async validateOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.validateOtp(body.email, body.otp);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req,
    @Body() body: { newPassword: string }
  ) {
    return this.authService.changePassword(req.user.userId, body.newPassword);
  }
}
