import { Module } from '@nestjs/common';
import { ProgramaService } from './programa.service';
import { ProgramaController } from './programa.controller';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { PlanIndicativoAuditoriaModule } from '../plan_indicativo_auditoria/plan_indicativo_auditoria.module';

@Module({
  imports: [SupabaseModule, PlanIndicativoAuditoriaModule],
  controllers: [ProgramaController],
  providers: [ProgramaService, SupabaseService],
})
export class ProgramaModule {}
