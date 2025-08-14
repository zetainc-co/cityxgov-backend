import { Module } from '@nestjs/common';
import { MetaProductoService } from './meta_producto.service';
import { MetaProductoController } from './meta_producto.controller';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { PlanIndicativoAuditoriaModule } from '../plan_indicativo_auditoria/plan_indicativo_auditoria.module';

@Module({
  imports: [SupabaseModule, PlanIndicativoAuditoriaModule],
  controllers: [MetaProductoController],
  providers: [MetaProductoService],
  exports: [MetaProductoService],
})
export class MetaProductoModule {}
