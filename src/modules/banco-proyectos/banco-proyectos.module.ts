import { Module } from '@nestjs/common';
import { BancoProyectosController } from './banco-proyectos.controller';
import { BancoProyectosService } from './banco-proyectos.service';
import { SupabaseModule } from '../../config/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [BancoProyectosController],
  providers: [BancoProyectosService],
  exports: [BancoProyectosService]
})
export class BancoProyectosModule {}
