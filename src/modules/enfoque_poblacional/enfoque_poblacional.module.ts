import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { EnfoquePoblacionalService } from './enfoque_poblacional.service';
import { EnfoquePoblacionalController } from './enfoque_poblacional.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [EnfoquePoblacionalController],
  providers: [EnfoquePoblacionalService],
  exports: [EnfoquePoblacionalService],
})
export class EnfoquePoblacionalModule {}
