import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { ProgramacionFinancieraService } from './programacion_financiera.service';
import { ProgramacionFinancieraController } from './programacion_financiera.controller';
import { FuentesFinanciacionModule } from '../fuentes_financiacion/fuentes_financiacion.module';
import { MetaProductoModule } from '../meta_producto/meta_producto.module';

@Module({
  imports: [
    SupabaseModule,
    FuentesFinanciacionModule,
    MetaProductoModule,
  ],
  providers: [ProgramacionFinancieraService],
  controllers: [ProgramacionFinancieraController],
  exports: [ProgramacionFinancieraService],
})
export class ProgramacionFinancieraModule {}
