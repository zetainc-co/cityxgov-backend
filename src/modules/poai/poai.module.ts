import { Module } from '@nestjs/common';
import { PoaiController } from './poai.controller';
import { PoaiService } from './poai.service';
import { PoaiPipe } from './pipes/poai.pipe';
import { SupabaseModule } from '../../config/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [PoaiController],
  providers: [PoaiService, PoaiPipe],
  exports: [PoaiService]
})
export class PoaiModule {}
