import { Module } from '@nestjs/common';
import { UsuarioAreaController } from './usuario_area.controller';
import { UsuarioAreaService } from './usuario_area.service';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { SupabaseModule } from 'src/config/supabase/supabase.module';

@Module({
    imports: [SupabaseModule],
    exports: [UsuarioAreaService],
    controllers: [UsuarioAreaController],
    providers: [UsuarioAreaService, SupabaseService],
})
export class UsuarioAreaModule {}
