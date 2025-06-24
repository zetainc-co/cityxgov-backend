import { Module } from '@nestjs/common';
import { MetaResultadoService } from './meta_resultado.service';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { MetaResultadoController } from './meta_resultado.controller';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Module({
  imports: [SupabaseModule],
  controllers: [MetaResultadoController],
  providers: [MetaResultadoService, SupabaseService],
})

export class MetaResultadoModule {}
