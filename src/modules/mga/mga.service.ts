// mga.service.ts
import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CreateMgaDto, UpdateMgaDto } from './dto/mga.dto';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import { remove as removeDiacritics } from 'diacritics';

@Injectable()
export class MgaService {
    constructor(private readonly supabaseService: SupabaseService) { }

    // Manejar upload de Excel con validaciones
    async uploadExcel(file: Express.Multer.File): Promise<any> {
        // Validar que se proporcionó un archivo
        if (!file) {
            throw new BadRequestException('No se ha proporcionado ningún archivo');
        }

        // Validar que sea un archivo Excel
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('El archivo debe ser un Excel (.xlsx o .xls)');
        }

        return await this.processExcelFile(file.buffer);
    }

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

            // Mapeo de headers del Excel a los campos de la base de datos
            const headerMap = {
                "Sector (MGA)": "sector",
                "Programa (MGA)": "programa",
                "Producto (MGA)": "producto",
                "Descripción del producto": "descripcion_producto",
                "Unidad de medida del producto": "unidad_medida_producto",
                "Producto activo": "producto_activo",
                "Código indicador (MGA)": "codigo_indicador",
                "Indicador de producto (MGA)": "indicador_producto",
                "Unidad de medida del indicador de producto": "unidad_medida_indicador",
                "Principal": "principal",
                "Indicador de producto activo": "indicador_producto_activo"
            };

            const expectedHeaders = Object.keys(headerMap);
            const normalize = (str: string) => removeDiacritics(str || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const normalizedExpected = expectedHeaders.map(normalize);

            const headers = jsonData[0] as string[];
            const normalizedHeaders = headers.map(normalize);

            // Validar headers (sin importar orden, tildes, espacios)
            const missingHeaders = normalizedExpected.filter(h => !normalizedHeaders.includes(h));
            const extraHeaders = normalizedHeaders.filter(h => !normalizedExpected.includes(h));
            if (missingHeaders.length > 0 || extraHeaders.length > 0) {
                throw new BadRequestException(
                    `El archivo Excel no cumple con la estructura de Catálogo MGA.\n` +
                    (missingHeaders.length > 0 ? `Faltan: ${missingHeaders.join(', ')}. ` : '') +
                    (extraHeaders.length > 0 ? `Sobrantes: ${extraHeaders.join(', ')}.` : '')
                );
            }

            // Reordenar los headers para el mapeo correcto
            const headerIndexMap: Record<string, number> = {};
            normalizedHeaders.forEach((h, idx) => {
                const expectedIdx = normalizedExpected.indexOf(h);
                if (expectedIdx !== -1) {
                    headerIndexMap[expectedHeaders[expectedIdx]] = idx;
                }
            });

            const dataRows = jsonData.slice(1) as any[][];

            const formattedData = dataRows.map((row) => {
                const obj: any = {};
                expectedHeaders.forEach((header) => {
                    const dbField = headerMap[header];
                    const idx = headerIndexMap[header];
                    let value = row[idx];
                    if (value === undefined || value === null || String(value).trim() === '') {
                        obj[dbField] = null;
                    } else if (dbField === 'codigo_indicador') {
                        obj[dbField] = Number(value) || null;
                    } else {
                        obj[dbField] = String(value).trim();
                    }
                });
                return obj;
            });

            // Validar y transformar los datos
            const mgaRecords = this.validateAndTransformData(formattedData);

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
        const allowedFields = [
            'sector',
            'programa',
            'producto',
            'descripcion_producto',
            'unidad_medida_producto',
            'producto_activo',
            'codigo_indicador',
            'indicador_producto',
            'unidad_medida_indicador',
            'principal',
            'indicador_producto_activo',
        ];

        const errors: string[] = [];

        const validatedData = data.map((row, index) => {
            const rowNumber = index + 2; // +2 porque índice 0 es fila 1, pero hay encabezados
            const record: CreateMgaDto = {};

            allowedFields.forEach((field) => {
                let value = row[field];
                if (value === undefined || value === null || String(value).trim() === '') {
                    record[field] = null;
                } else if (field === 'codigo_indicador') {
                    const num = Number(value);
                    if (isNaN(num)) {
                        record[field] = null; // Si no es número, guardar como null
                    } else {
                        record[field] = num;
                    }
                } else {
                    // Campos de texto sin restricción de longitud
                    record[field] = String(value).trim();
                }
            });
            return record;
        });

        if (errors.length > 0) {
            throw new BadRequestException(
                `Errores de validación encontrados:\n${errors.join('\n')}`,
            );
        }

        return validatedData;
    }


    // Validar datos de actualización
    private validateUpdateData(updateData: UpdateMgaDto): UpdateMgaDto {
        const errors: string[] = [];
        const validatedData: UpdateMgaDto = {};

        const allowedFields = [
            'sector',
            'programa',
            'producto',
            'descripcion_producto',
            'unidad_medida_producto',
            'producto_activo',
            'codigo_indicador',
            'indicador_producto',
            'unidad_medida_indicador',
            'principal',
            'indicador_producto_activo',
        ];

        allowedFields.forEach((field) => {
            if (updateData[field] !== undefined) {
                let value = updateData[field];
                if (value === null || value === undefined || String(value).trim() === '') {
                    validatedData[field] = null;
                } else if (field === 'codigo_indicador') {
                    const num = Number(value);
                    if (isNaN(num)) {
                        validatedData[field] = null; // Si no es número, guardar como null
                    } else {
                        validatedData[field] = num;
                    }
                } else {
                    validatedData[field] = String(value).trim();
                }
            }
        });

        if (errors.length > 0) {
            throw new BadRequestException(
                `Errores de validación: ${errors.join(', ')}`,
            );
        }

        return validatedData;
    }

    // Insertar datos en la base de datos en lotes
    private async createMgaRecords(mgaRecords: CreateMgaDto[]): Promise<any[]> {
        try {
            const batchSize = 500; // Inserción de 500 registros por lote
            const allInsertedData: any[] = [];


            // Dividir en lotes y procesar cada uno
            for (let i = 0; i < mgaRecords.length; i += batchSize) {
                const batch = mgaRecords.slice(i, i + batchSize);
                const batchNumber = Math.floor(i / batchSize) + 1;
                const totalBatches = Math.ceil(mgaRecords.length / batchSize);

                const { data, error } = await this.supabaseService.clientAdmin
                    .from('caracterizacion_mga')
                    .insert(batch)
                    .select();

                if (error) {
                    throw new BadRequestException(
                        `Error insertando lote ${batchNumber}: ${error.message}`,
                    );
                }

                if (data) {
                    allInsertedData.push(...data);
                }
            }

            return allInsertedData;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado insertando datos: ${error.message}`,
            );
        }
    }

    // Método findAll con paginación
    async findAll(page?: number, limit?: number): Promise<any> {
        try {
            let query = this.supabaseService.clientAdmin
                .from('caracterizacion_mga')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            // Si se especifica paginación
            if (page && limit) {
                const start = (page - 1) * limit;
                const end = start + limit - 1;
                query = query.range(start, end);
            }

            const { data, error, count } = await query;

            if (error) {
                throw new BadRequestException(
                    `Error obteniendo datos: ${error.message}`,
                );
            }

            const recordCount = data ? data.length : 0;

            return {
                data: data || [],
                total: count || 0,
                page: page || 1,
                limit: limit || recordCount,
                totalPages: limit ? Math.ceil((count || 0) / limit) : 1
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado obteniendo datos: ${error.message}`,
            );
        }
    }

    // Método para obtener TODOS los registros (para casos específicos)
    async findAllWithoutPagination(): Promise<any[]> {
        try {
            const allRecords: any[] = [];
            let from = 0;
            const batchSize = 500; // Inserción de 500 registros por lote
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await this.supabaseService.clientAdmin
                    .from('caracterizacion_mga')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(from, from + batchSize - 1);

                if (error) {
                    throw new BadRequestException(`Error obteniendo datos: ${error.message}`);
                }

                if (data && data.length > 0) {
                    allRecords.push(...data);
                    from += batchSize;
                    hasMore = data.length === batchSize;
                } else {
                    hasMore = false;
                }
            }

            return allRecords;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado obteniendo todos los datos: ${error.message}`,
            );
        }
    }

    // Método para buscar códigos MGA con sugerencias
    async searchMga(searchTerm: string, limit: number = 50): Promise<any[]> {
        try {
            // Si no hay término de búsqueda, retornar array vacío
            if (!searchTerm || !searchTerm.trim()) {
                return [];
            }

            const term = searchTerm.trim();

            // Usar la función RPC personalizada de Supabase
            const { data, error } = await this.supabaseService.clientAdmin
                .rpc('search_mga_codes', {
                    search_term: term,
                    max_results: limit
                });

            if (error) {
                throw new BadRequestException(
                    `Error en búsqueda: ${error.message}`,
                );
            }

            return data || [];
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado en búsqueda: ${error.message}`,
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

    // Actualizar un registro
    async update(id: number, updateMgaDto: UpdateMgaDto): Promise<any> {
        try {
            // Verificar que el registro existe
            await this.findOne(id);

            // Validar los datos de entrada si se proporcionan
            const validatedData = this.validateUpdateData(updateMgaDto);

            // Actualizar el registro en la base de datos
            const { data, error } = await this.supabaseService.clientAdmin
                .from('caracterizacion_mga')
                .update({
                    ...validatedData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error actualizando registro:', error);
                throw new BadRequestException(
                    `Error actualizando registro: ${error.message}`,
                );
            }

            return {
                message: 'Registro MGA actualizado exitosamente',
                data: data
            };
        } catch (error) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new BadRequestException(
                `Error inesperado actualizando registro: ${error.message}`,
            );
        }
    }

    // Eliminar un registro
    async delete(id: number): Promise<any> {
        try {
            // Verificar que el registro existe antes de eliminarlo
            await this.findOne(id);

            const { error } = await this.supabaseService.clientAdmin
                .from('caracterizacion_mga')
                .delete()
                .eq('id', id);

            if (error) {
                throw new BadRequestException(
                    `Error eliminando registro: ${error.message}`,
                );
            }

            return {
                message: 'Registro MGA eliminado exitosamente'
            };
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
