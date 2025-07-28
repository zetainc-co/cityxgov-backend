import { Module } from '@nestjs/common';
import { OdsController } from './ods.controller';
import { OdsService } from './ods.service';
import { SupabaseModule } from 'src/config/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [OdsController],
  providers: [OdsService],
  exports: [OdsService],
})
export class OdsModule {}
