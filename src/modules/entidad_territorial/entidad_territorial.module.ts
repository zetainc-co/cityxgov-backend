import { Module } from '@nestjs/common';
import { EntidadTerritorialService } from './entidad_territorial.service';
import { EntidadTerritorialController } from './entidad_territorial.controller';
import { SupabaseModule } from 'src/config/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [EntidadTerritorialController],
  providers: [EntidadTerritorialService],
  exports: [EntidadTerritorialService],
})
export class EntidadTerritorialModule {}
