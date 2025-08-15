import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { LineaEstrategicaService } from './linea_estrategica.service';
import { PlanIndicativoAuditoriaModule } from '../plan_indicativo_auditoria/plan_indicativo_auditoria.module';
import { LineaEstrategicaController } from './linea_estrategica.controller';

@Module({
  imports: [SupabaseModule, PlanIndicativoAuditoriaModule],
  providers: [LineaEstrategicaService],
  controllers: [LineaEstrategicaController],
  exports: [LineaEstrategicaService],
})
export class LineaEstrategicaModule {}
