import { Module } from '@nestjs/common';
import { ReportesPoaiController } from './reportes_poai.controller';
import { ReportesPoaiService } from './reportes_poai.service';
import { SupabaseModule } from '../../config/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ReportesPoaiController],
  providers: [ReportesPoaiService],
  exports: [ReportesPoaiService],
})
export class ReportesPoaiModule {}
