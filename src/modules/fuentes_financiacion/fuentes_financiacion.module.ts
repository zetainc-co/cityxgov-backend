import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { FuentesFinanciacionService } from './fuentes_financiacion.service';
import { FuentesFinanciacionController } from './fuentes_financiacion.controller';

@Module({
  imports: [SupabaseModule],
  providers: [FuentesFinanciacionService],
  controllers: [FuentesFinanciacionController],
  exports: [FuentesFinanciacionService],
})
export class FuentesFinanciacionModule {}
