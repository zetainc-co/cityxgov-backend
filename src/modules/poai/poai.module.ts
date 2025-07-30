import { Module } from '@nestjs/common';
import { PoaiService } from './poai.service';
import { PoaiController } from './poai.controller';
import { SupabaseModule } from '../../config/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PoaiController],
  providers: [PoaiService],
  exports: [PoaiService],
})
export class PoaiModule {}
