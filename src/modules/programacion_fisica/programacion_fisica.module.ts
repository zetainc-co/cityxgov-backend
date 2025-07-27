import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { ProgramacionFisicaService } from './programacion_fisica.service';
import { ProgramacionFisicaController } from './programacion_fisica.controller';
import { FuentesFinanciacionModule } from '../fuentes_financiacion/fuentes_financiacion.module';
import { MetaProductoModule } from '../meta_producto/meta_producto.module';

@Module({
  imports: [SupabaseModule, FuentesFinanciacionModule, MetaProductoModule],
  providers: [ProgramacionFisicaService],
  controllers: [ProgramacionFisicaController],
  exports: [ProgramacionFisicaService],
})
export class ProgramacionFisicaModule {}
