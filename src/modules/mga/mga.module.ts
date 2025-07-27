import { Module } from '@nestjs/common';
import { MgaController } from './mga.controller';
import { MgaService } from './mga.service';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
@Module({
  imports: [SupabaseModule],
  controllers: [MgaController],
  providers: [MgaService],
  exports: [MgaService],
})
export class MgaModule {}
