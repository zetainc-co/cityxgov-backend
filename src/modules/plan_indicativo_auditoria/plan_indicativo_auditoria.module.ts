import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { PlanIndicativoAuditoriaService } from 'src/modules/plan_indicativo_auditoria/plan_indicativo_auditoria.service';
import { PlanIndicativoAuditoriaController } from 'src/modules/plan_indicativo_auditoria/plan_indicativo_auditoria.controller';

@Module({
  imports: [SupabaseModule],
  providers: [PlanIndicativoAuditoriaService],
  controllers: [PlanIndicativoAuditoriaController],
  exports: [PlanIndicativoAuditoriaService],
})
export class PlanIndicativoAuditoriaModule {}


