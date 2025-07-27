import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { ValidateUsuarioPipe } from './pipes/usuarios.pipe';
import { PasswordValidationPipe } from './pipes/password.pipe';

@Module({
  imports: [SupabaseModule],
  controllers: [UsuariosController],
  providers: [UsuariosService, ValidateUsuarioPipe, PasswordValidationPipe],
  exports: [UsuariosService],
})
export class UsuariosModule {}
