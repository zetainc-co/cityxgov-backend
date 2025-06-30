import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { RolModule } from './modules/rol/rol.module';
import { MgaModule } from './modules/mga/mga.module';
import { OdsModule } from './modules/ods/ods.module';
import { AreaModule } from './modules/area/area.module';
import { AuthModule } from './modules/auth/auth.module';
import { SupabaseModule } from './config/supabase/supabase.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ProgramaModule } from './modules/programas/programa.module';
import { MetaProductoModule } from './modules/meta_producto/meta_producto.module';
import { MetaResultadoModule } from './modules/meta_resultado/meta_resultado.module';
import { LineaEstrategicaModule } from './modules/linea_estrategica/linea_estrategica.module';
import { EnfoquePoblacionalModule } from './modules/enfoque_poblacional/enfoque_poblacional.module';
import { FuentesFinanciacionModule } from './modules/fuentes_financiacion/fuentes_financiacion.module';
import { FinanciacionPeriodoModule } from './modules/financiacion_periodo/financiacion_periodo.module';
import { EntidadTerritorialModule } from './modules/entidad_territorial/entidad_territorial.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MgaModule,
    OdsModule,
    RolModule,
    AuthModule,
    AreaModule,
    SupabaseModule,
    UsuariosModule,
    ProgramaModule,
    // UsuarioAreaModule,
    MetaProductoModule,
    MetaResultadoModule,
    LineaEstrategicaModule,
    EnfoquePoblacionalModule,
    FuentesFinanciacionModule,
    FinanciacionPeriodoModule,
    EntidadTerritorialModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
