// mga.service.ts
import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CreateMgaDto } from './dto/mga.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';

@Injectable()
export class MgaService {
    constructor(private readonly supabaseService: SupabaseService) { }

    // Procesar archivo Excel
    async processExcelFile(buffer: Buffer): Promise<any> {
        try {
            // Leer el archivo Excel
            const workbook = XLSX.read(buffer, { type: 'buffer' });

            if (!workbook.SheetNames.length) {
                throw new BadRequestException(
                    'El archivo Excel no contiene hojas de cálculo',
                );
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convertir a JSON con opciones mejoradas
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1, // Usar números como headers inicialmente
                defval: '', // Valor por defecto para celdas vacías
                blankrows: false, // Omitir filas en blanco
            });

            if (!jsonData || jsonData.length < 2) {
                throw new BadRequestException(
                    'El archivo Excel debe contener al menos una fila de encabezados y una fila de datos',
                );
            }

            // Convertir usando los encabezados de la primera fila
            const headers = jsonData[0] as string[];
            const dataRows = jsonData.slice(1) as any[][];

            const formattedData = dataRows.map((row) => {
                const obj: any = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });

            // Validar y transformar los datos
            const mgaRecords = this.validateAndTransformData(formattedData);

            // Verificar duplicados antes de insertar
            await this.checkForDuplicates(mgaRecords);

            // Insertar en la base de datos usando transacción
            const result = await this.createMgaRecords(mgaRecords);

            return {
                message: 'Archivo procesado exitosamente',
                recordsProcessed: mgaRecords.length,
                recordsCreated: result.length,
                data: result,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error procesando archivo Excel: ${error.message}`,
            );
        }
    }

    // Validar y transformar datos
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
            'subprograma_nombre',
        ];

        const errors: string[] = [];

        const validatedData = data
            .map((row, index) => {
                const rowNumber = index + 2; // +2 porque índice 0 es fila 1, pero hay encabezados

                // Verificar que todos los campos requeridos estén presentes y no vacíos
                const missingFields = requiredFields.filter((field) => {
                    const value = row[field];
                    return (
                        value === undefined || value === null || String(value).trim() === ''
                    );
                });

                if (missingFields.length > 0) {
                    errors.push(
                        `Fila ${rowNumber}: Faltan o están vacíos los siguientes campos: ${missingFields.join(', ')}`,
                    );
                    return null;
                }

                // Validar tipos de datos numéricos
                const numericFields = [
                    'sector_codigo',
                    'programa_codigo',
                    'producto_codigo',
                    'indicador_codigo',
                    'subprograma_codigo',
                ];
                const invalidNumericFields = numericFields.filter((field) => {
                    const value = row[field];
                    return isNaN(Number(value)) || !Number.isInteger(Number(value));
                });

                if (invalidNumericFields.length > 0) {
                    errors.push(
                        `Fila ${rowNumber}: Los siguientes campos deben ser números enteros: ${invalidNumericFields.join(', ')}`,
                    );
                    return null;
                }

                // Validar longitud de strings
                const stringFields = [
                    'sector_nombre',
                    'programa_nombre',
                    'producto_nombre',
                    'indicador_nombre',
                    'unidad_medida',
                    'subprograma_nombre',
                ];
                const tooLongFields = stringFields.filter((field) => {
                    const value = String(row[field]).trim();
                    return value.length > 255; // Asumiendo límite de 255 caracteres
                });

                if (tooLongFields.length > 0) {
                    errors.push(
                        `Fila ${rowNumber}: Los siguientes campos exceden la longitud máxima (255 caracteres): ${tooLongFields.join(', ')}`,
                    );
                    return null;
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
            })
            .filter((record) => record !== null);

        if (errors.length > 0) {
            throw new BadRequestException(
                `Errores de validación encontrados:\n${errors.join('\n')}`,
            );
        }

        return validatedData;
    }

    // Verificar duplicados
    private async checkForDuplicates(mgaRecords: CreateMgaDto[]): Promise<void> {
        // Verificar duplicados dentro del mismo archivo
        const seen = new Set<string>();
        const duplicates: string[] = [];

        mgaRecords.forEach((record, index) => {
            const key = `${record.sector_codigo}-${record.programa_codigo}-${record.producto_codigo}-${record.indicador_codigo}`;
            if (seen.has(key)) {
                duplicates.push(
                    `Fila ${index + 2}: Registro duplicado con sector_codigo: ${record.sector_codigo}, programa_codigo: ${record.programa_codigo}, producto_codigo: ${record.producto_codigo}, indicador_codigo: ${record.indicador_codigo}`,
                );
            }
            seen.add(key);
        });

        if (duplicates.length > 0) {
            throw new BadRequestException(
                `Duplicados encontrados en el archivo:\n${duplicates.join('\n')}`,
            );
        }
    }

    // Insertar datos en la base de datos
    private async createMgaRecords(mgaRecords: CreateMgaDto[]): Promise<any[]> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('caracterizacion_mga')
                .insert(mgaRecords)
                .select();

            if (error) {
                console.error('Error de Supabase:', error);
                throw new BadRequestException(
                    `Error insertando datos en la base de datos: ${error.message}`,
                );
            }

            return data || [];
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado insertando datos: ${error.message}`,
            );
        }
    }

    // Obtener todos los registros
    async findAll(): Promise<any[]> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('caracterizacion_mga')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error obteniendo datos:', error);
                throw new BadRequestException(
                    `Error obteniendo datos: ${error.message}`,
                );
            }

            return data || [];
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado obteniendo datos: ${error.message}`,
            );
        }
    }

    // Obtener un registro por ID
    async findOne(id: number): Promise<any> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('caracterizacion_mga')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new NotFoundException(
                        `No se encontró el registro MGA con ID: ${id}`,
                    );
                }
                console.error('Error obteniendo registro:', error);
                throw new BadRequestException(
                    `Error obteniendo registro: ${error.message}`,
                );
            }

            return data;
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado obteniendo registro: ${error.message}`,
            );
        }
    }

    // Eliminar un registro
    async delete(id: number): Promise<void> {
        try {
            // Verificar que el registro existe antes de eliminarlo
            await this.findOne(id);

            const { error } = await this.supabaseService.clientAdmin
                .from('caracterizacion_mga')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error eliminando registro:', error);
                throw new BadRequestException(
                    `Error eliminando registro: ${error.message}`,
                );
            }
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado eliminando registro: ${error.message}`,
            );
        }
    }
}
