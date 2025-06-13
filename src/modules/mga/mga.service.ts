import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { CreateMgaDto } from './dto/mga.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class MgaService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async processExcelFile(buffer: Buffer): Promise<any> {
    try {
      // Leer el archivo Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        throw new BadRequestException('El archivo Excel está vacío');
      }

      // Validar y transformar los datos
      const mgaRecords = this.validateAndTransformData(jsonData);

      // Insertar en la base de datos
      const result = await this.createMgaRecords(mgaRecords);

      return {
        message: 'Archivo procesado exitosamente',
        recordsProcessed: mgaRecords.length,
        recordsCreated: result.length,
        data: result
      };

    } catch (error) {
      throw new BadRequestException(`Error procesando archivo Excel: ${error.message}`);
    }
  }

  private validateAndTransformData(data: any[]): CreateMgaDto[] {
    const requiredFields = [
      'sector_codigo',
      'sector_nombre',
      'programa_codigo',
      'programa_nombre',
      'producto_codigo',
      'producto_nombre',
      'indicador_codigo',
      'indicador_nombre',
      'unidad_medida',
      'subprograma_codigo',
      'subprograma_nombre'
    ];

    return data.map((row, index) => {
      // Verificar que todos los campos requeridos estén presentes
      const missingFields = requiredFields.filter(field => !row[field]);
      if (missingFields.length > 0) {
        throw new BadRequestException(
          `Fila ${index + 1}: Faltan los siguientes campos: ${missingFields.join(', ')}`
        );
      }

      return {
        sector_codigo: Number(row.sector_codigo),
        sector_nombre: String(row.sector_nombre).trim(),
        programa_codigo: Number(row.programa_codigo),
        programa_nombre: String(row.programa_nombre).trim(),
        producto_codigo: Number(row.producto_codigo),
        producto_nombre: String(row.producto_nombre).trim(),
        indicador_codigo: Number(row.indicador_codigo),
        indicador_nombre: String(row.indicador_nombre).trim(),
        unidad_medida: String(row.unidad_medida).trim(),
        subprograma_codigo: Number(row.subprograma_codigo),
        subprograma_nombre: String(row.subprograma_nombre).trim(),
      };
    });
  }

  private async createMgaRecords(mgaRecords: CreateMgaDto[]): Promise<any[]> {
    const { data, error } = await this.supabaseService.clientAdmin
      .from('caracterizacion_mga')
      .insert(mgaRecords)
      .select();

    if (error) {
      throw new BadRequestException(`Error insertando datos: ${error.message}`);
    }

    return data;
  }

  async findAll(): Promise<any[]> {
    const { data, error } = await this.supabaseService.clientAdmin
      .from('caracterizacion_mga')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Error obteniendo datos: ${error.message}`);
    }

    return data;
  }

  async findOne(id: number): Promise<any> {
    const { data, error } = await this.supabaseService.clientAdmin
      .from('caracterizacion_mga')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new BadRequestException(`Error obteniendo registro: ${error.message}`);
    }

    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabaseService.clientAdmin
      .from('caracterizacion_mga')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Error eliminando registro: ${error.message}`);
    }
  }
}
