import { Module } from '@nestjs/common';
import { AreaService } from './area.service';
import { AreaController } from './area.controller';
import { SupabaseModule } from 'src/config/supabase/supabase.module';

@Module({
    imports: [SupabaseModule],
    controllers: [AreaController],
    providers: [AreaService],
    exports: [AreaService]
})
export class AreaModule {}
