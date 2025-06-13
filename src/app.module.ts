import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { RolModule } from './modules/rol/rol.module';
import { AreaModule } from './modules/area/area.module';
import { AuthModule } from './modules/auth/auth.module';
import { SupabaseModule } from './config/supabase/supabase.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ProgramaModule } from './modules/programas/programa.module';
import { UsuarioAreaModule } from './modules/usuario_area/usuario_area.module';
import { MetaResultadoModule } from './modules/meta_resultado/meta_resultado.module';
import { LineaEstrategicaModule } from './modules/linea_estrategica/linea_estrategica.module';
import { MgaModule } from './modules/mga/mga.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    SupabaseModule,
    AuthModule,
    RolModule,
    AreaModule,
    UsuarioAreaModule,
    LineaEstrategicaModule,
    ProgramaModule,
    MetaResultadoModule,
    UsuariosModule,
    MgaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
