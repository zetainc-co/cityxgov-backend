import { Module } from '@nestjs/common';
import { TopesPresupuestalesController } from './topes-presupuestales.controller';
import { TopesPresupuestalesService } from './topes-presupuestales.service';
import { SupabaseModule } from '../../config/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [TopesPresupuestalesController],
  providers: [TopesPresupuestalesService],
  exports: [TopesPresupuestalesService]
})
export class TopesPresupuestalesModule {}
