import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/config/supabase/supabase.module';
import { LineaEstrategicaService } from './linea_estrategica.service';
import { LineaEstrategicaController } from './linea_estrategica.controller';

@Module({
  imports: [SupabaseModule],
  providers: [LineaEstrategicaService],
  controllers: [LineaEstrategicaController],
  exports: [LineaEstrategicaService]
})
export class LineaEstrategicaModule {}
