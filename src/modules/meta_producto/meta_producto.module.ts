import { Module } from '@nestjs/common';
import { MetaProductoService } from './meta_producto.service';
import { MetaProductoController } from './meta_producto.controller';
import { SupabaseModule } from 'src/config/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [MetaProductoController],
  providers: [MetaProductoService],
  exports: [MetaProductoService],
})
export class MetaProductoModule {} 