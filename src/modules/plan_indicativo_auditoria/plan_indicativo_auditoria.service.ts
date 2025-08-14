import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PlanIndicativoAuditoriaService {
    constructor(private readonly supabaseService: SupabaseService) { }
    private sectorColumns: string[] = [];
    private progColumns: string[] = [];

    async capturarSnapshot(
        usuarioId: number | null,
        triggeredTable: string,
        accion: 'INSERT' | 'UPDATE' | 'DELETE',
    ) {
        try {
            const { error } = await this.supabaseService.clientAdmin.rpc(
                'capturar_snapshot_plan_indicativo',
                { p_usuario_id: usuarioId, p_triggered_table: triggeredTable, p_accion: accion },
            );
            if (error) throw new InternalServerErrorException(error.message);
            return { status: true };
        } catch (e) {
            return { status: false, error: (e as any).message };
        }
    }

    private setupMainTitle(ws: ExcelJS.Worksheet, fecha: Date, lastCol: string = 'AO') {
        // Un solo título ocupando filas 1 y 2 completas
        ws.mergeCells(`A1:${lastCol}2`);
        const titleCell = ws.getCell('A1');
        titleCell.value = 'Plan Indicativo Municipal de Desarrollo';
        titleCell.font = { size: 16, bold: true, name: 'Arial' } as any;
        titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } as any;
    }

    async listarSnapshots({ fechaDesde, fechaHasta }: { fechaDesde?: string; fechaHasta?: string }) {
        let query = this.supabaseService.clientAdmin
            .from('plan_indicativo_historial')
            .select(`
        id, usuario_id, triggered_table, accion, fecha_cambio, snapshot,
        usuario:usuarios(id, nombre, apellido, correo, identificacion)
      `)
            .order('fecha_cambio', { ascending: false });
        if (fechaDesde) query = query.gte('fecha_cambio', fechaDesde);
        if (fechaHasta) query = query.lte('fecha_cambio', fechaHasta);
        const { data, error } = await query;
        if (error) throw new InternalServerErrorException(error.message);
        return { status: true, data };
    }

    async obtenerSnapshot(id: number) {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('plan_indicativo_historial')
            .select(`
        id, usuario_id, triggered_table, accion, fecha_cambio, snapshot,
        usuario:usuarios(id, nombre, apellido, correo, identificacion)
      `)
            .eq('id', id)
            .single();
        if (error) throw new InternalServerErrorException(error.message);
        return { status: true, data };
    }

    // Método público requerido por el controlador
    async generarExcelSnapshot(id: number): Promise<Buffer> {
        return await this._generateExcelSnapshotFull(id);
    }

    // ================= Helpers/implementación interna =================
    private async _generateExcelSnapshotFull(id: number): Promise<Buffer> {
        const { data, error } = await this.supabaseService.clientAdmin
            .from('plan_indicativo_historial')
            .select('id, fecha_cambio, snapshot')
            .eq('id', id)
            .single();
        if (error || !data) throw new InternalServerErrorException('No se encontró el snapshot');

        const snapshot = (data.snapshot || {}) as any;
        const fecha = new Date(data.fecha_cambio);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Plan Indicativo', {
            pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
        });

        const [fuentesFinanciacion] = await Promise.all([
            this.fetchFuentesFinanciacion(),
            this.fetchEnfoquePoblacional(),
        ]);
        const headersInfo = this.setupMainHeaders(worksheet, fuentesFinanciacion);
        this.setupMainTitle(worksheet, fecha, headersInfo.lastCol);

        const areasById = await this.fetchAreasById(snapshot);
        const { metasByMetaProductoId, lineaById, metaResultadoById } = await this.fetchMetaResultadoYLineas(snapshot);
        const mgaById = await this.fetchMgaById(snapshot);
        const odsById = await this.fetchOdsById(snapshot);
        const firstProgramaByLinea = await this.fetchFirstProgramaByLinea(Array.from(lineaById.keys()));
        const enfoquesByMetaId = await this.fetchEnfoquePoblacionalIdsByMeta(snapshot);

        const progFisicaByMetaId = new Map<number, any>();
        const progFis = Array.isArray(snapshot.programacion_fisica) ? snapshot.programacion_fisica : [];
        for (const pf of progFis) progFisicaByMetaId.set(Number(pf.meta_id), pf);

        const metasProducto = Array.isArray(snapshot.meta_producto) ? snapshot.meta_producto : [];

        let currentRow = 5;
        for (const mp of metasProducto) {
            const relaciones = metasByMetaProductoId.get(Number(mp.id)) || [];
            const mr = relaciones.length > 0 ? metaResultadoById.get(relaciones[0]) : undefined;
            const linea = mr ? lineaById.get(Number(mr.linea_estrategica_id)) : undefined;
            const pf = progFisicaByMetaId.get(Number(mp.id));

            const sec = currentRow - 4;
            worksheet.getCell(`A${currentRow}`).value = sec;
            worksheet.getCell(`B${currentRow}`).value = areasById.get(Number(mp.area_id)) || '';
            worksheet.getCell(`C${currentRow}`).value = linea?.nombre || '';
            worksheet.getCell(`D${currentRow}`).value = mr?.nombre || '';
            worksheet.getCell(`E${currentRow}`).value = mr?.linea_base ?? '';
            worksheet.getCell(`F${currentRow}`).value = mr?.['año_linea_base'] ?? '';
            worksheet.getCell(`G${currentRow}`).value = mr?.meta_cuatrienio ?? '';
            worksheet.getCell(`H${currentRow}`).value = mr?.fuente ?? '';
            worksheet.getCell(`I${currentRow}`).value = linea?.plan_nacional || '';
            worksheet.getCell(`J${currentRow}`).value = linea?.plan_departamental || '';
            worksheet.getCell(`K${currentRow}`).value = linea ? (firstProgramaByLinea.get(Number(linea.id)) || '') : '';

            let mga = mgaById.get(Number(mp.caracterizacion_mga_id));
            if (!mga && mp?.caracterizacion_mga_id) {
                // Fallback: si por alguna razón no está en el prefetch, traerlo directo y cachearlo
                const { data: mgaOne } = await this.supabaseService.clientAdmin
                    .from('caracterizacion_mga')
                    .select('id, sector, programa, producto, codigo_indicador, indicador_producto, unidad_medida_indicador, unidad_medida_producto')
                    .eq('id', Number(mp.caracterizacion_mga_id))
                    .maybeSingle();
                if (mgaOne) {
                    mga = mgaOne as any;
                    mgaById.set(Number(mgaOne.id), mgaOne);
                }
            }
            worksheet.getCell(`L${currentRow}`).value = `${mp?.codigo_sector || ''}${mga?.sector ? ' - ' + mga.sector : ''}`;
            worksheet.getCell(`M${currentRow}`).value = mp?.codigo_programa || '';
            worksheet.getCell(`N${currentRow}`).value = odsById.get(Number(mp.ods_id)) || '';
            worksheet.getCell(`O${currentRow}`).value = `${mp?.codigo_producto || ''}${mga?.producto ? ' - ' + mga.producto : ''}`;
            worksheet.getCell(`P${currentRow}`).value = mp?.instrumento_planeacion || '';

            worksheet.getCell(`Q${currentRow}`).value = mp?.nombre || '';
            const codigoIndicadorMGA = (mp as any)?.codigo_indicador_mga ?? '';
            const cellR = worksheet.getCell(`R${currentRow}`);
            cellR.value = codigoIndicadorMGA !== '' && codigoIndicadorMGA !== null && codigoIndicadorMGA !== undefined
                ? String(codigoIndicadorMGA)
                : '';
            (cellR as any).numFmt = '@';
            worksheet.getCell(`S${currentRow}`).value = mp?.nombre_indicador || mga?.indicador_producto || '';
            worksheet.getCell(`T${currentRow}`).value = mp?.unidad_medida || '';
            worksheet.getCell(`U${currentRow}`).value = (mp as any)?.unidad_medida_indicador_producto || mga?.unidad_medida_indicador || mga?.unidad_medida_producto || '';
            worksheet.getCell(`V${currentRow}`).value = mp?.linea_base ?? '';
            worksheet.getCell(`W${currentRow}`).value = mp?.meta_numerica ?? '';
            worksheet.getCell(`X${currentRow}`).value = mp?.orientacion || '';

            // Marcar dinámicamente enfoques poblacionales seleccionados
            const idsFromSnapshot = Array.isArray(mp?.enfoque_poblacional_ids)
                ? (mp.enfoque_poblacional_ids as any[]).map((v: any) => Number(v))
                : [];
            const idsFromDb = enfoquesByMetaId.get(Number(mp.id)) || [];
            const selectedIds = new Set<number>([...idsFromSnapshot, ...idsFromDb].filter((v) => Number.isFinite(v)));
            if (selectedIds.size > 0) {
                this.enfoquePoblacionalColumns.forEach(({ col, id }) => {
                    if (selectedIds.has(id)) worksheet.getCell(`${col}${currentRow}`).value = 'X';
                });
            }

            // Enfoque Territorial (Sector): 1=Urbano, 2=Rural
            const enfoqueTerritorial = Array.isArray((mp as any)?.enfoque_territorial) ? (mp as any).enfoque_territorial : [];
            const [sectorUrbanoCol, sectorRuralCol] = this.sectorColumns.length === 2 ? this.sectorColumns : ['AI', 'AJ'];
            if (enfoqueTerritorial.includes(1)) worksheet.getCell(`${sectorUrbanoCol}${currentRow}`).value = 'X'; // Urbano
            if (enfoqueTerritorial.includes(2)) worksheet.getCell(`${sectorRuralCol}${currentRow}`).value = 'X'; // Rural

            if (pf) {
                const cols = this.progColumns.length === 5 ? this.progColumns : ['AK', 'AL', 'AM', 'AN', 'AO'];
                worksheet.getCell(`${cols[0]}${currentRow}`).value = pf.periodo_uno ?? 0;
                worksheet.getCell(`${cols[1]}${currentRow}`).value = pf.periodo_dos ?? 0;
                worksheet.getCell(`${cols[2]}${currentRow}`).value = pf.periodo_tres ?? 0;
                worksheet.getCell(`${cols[3]}${currentRow}`).value = pf.periodo_cuatro ?? 0;
                // "Pr. 2028" debe quedar en blanco
                worksheet.getCell(`${cols[4]}${currentRow}`).value = '';
            }

            // Total cuatrienio (2024-2027) suma de todas las fuentes
            if (headersInfo.finStart && headersInfo.finEnd && headersInfo.totalCol) {
                const totalCell = worksheet.getCell(`${headersInfo.totalCol}${currentRow}`);
                totalCell.value = { formula: `SUM(${headersInfo.finStart}${currentRow}:${headersInfo.finEnd}${currentRow})` } as any;
                totalCell.alignment = { horizontal: 'center', vertical: 'middle' } as any;
            }

            // Rellenar en blanco las columnas del bloque de Seguimiento + Fuentes + Total
            this.applyRowBorders(worksheet, currentRow, 'A', headersInfo.lastCol);
            currentRow++;
        }

        this.configureColumnWidths(worksheet);
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }


    private setupMainHeaders(ws: ExcelJS.Worksheet, fuentesFinanciacion: { id: number; nombre: string }[]): { lastCol: string; finStart?: string; finEnd?: string; totalCol?: string } {
        // === PRIMERA FILA DE HEADERS (fila 3) - Headers principales ===
        const mainHeaders = [
            'N° Meta', 'Dependencia Líder', 'Eje Plan Municipal de Desarrollo 2024 - 2028',
            'Meta de Resultado', 'Línea Base', 'Año Línea Base', 'Meta 2028', 'Fuente',
            'Plan Nacional de Desarrollo', 'Plan Departamental de Desarrollo',
            'Programa Plan Municipal de Desarrollo 2024 - 2028', 'Cód. Sector MGA',
            'Cód. Programa MGA', 'ODS', 'Cód. Producto MGA', 'Instrumento de Planeación',
            'Producto PMD', 'Cód. Indicador MGA', 'Indicador Producto', 'Unidad de Medida',
            'Unidad de Medida MGA', 'Línea Base', 'Meta 2028', 'Orientación de la Meta'
        ];

        const mainCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'];

        mainHeaders.forEach((text, idx) => {
            const cell = ws.getCell(`${mainCols[idx]}3`);
            cell.value = text;
            this.applyHeaderStyle(cell, 'FFE6F5E6');
        });

        // === HEADER "ENFOQUE POBLACIONAL" dinámico ===
        // Obtener enfoques disponibles desde BD
        const enfoques = this.cachedEnfoquePoblacional || [];
        const enfoqueStart = 'Y';
        const enfoqueEnd = this.numberToColumn(this.columnToNumber(enfoqueStart) + Math.max(1, enfoques.length) - 1);
        ws.mergeCells(`${enfoqueStart}3:${enfoqueEnd}3`);
        const enfoqueCell = ws.getCell(`${enfoqueStart}3`);
        enfoqueCell.value = 'Enfoque Poblacional (Sí aplica)';
        enfoqueCell.font = { size: 12, bold: true, name: 'Arial' } as any;
        enfoqueCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } as any;
        enfoqueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } } as any;
        enfoqueCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        } as any;

        // === HEADER "SECTOR" (Enfoque Territorial) ===
        // Comienza justo después del bloque de Enfoque Poblacional
        const sectorStart = this.numberToColumn(this.columnToNumber(enfoqueEnd) + 1);
        const sectorEnd = this.numberToColumn(this.columnToNumber(sectorStart) + 1); // 2 columnas
        ws.mergeCells(`${sectorStart}3:${sectorEnd}3`);
        const sectorCell = ws.getCell(`${sectorStart}3`);
        sectorCell.value = 'Sector';
        sectorCell.font = { size: 12, bold: true, name: 'Arial' } as any;
        sectorCell.alignment = { horizontal: 'center', vertical: 'middle' } as any;
        sectorCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } } as any;
        sectorCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        } as any;

        // === HEADER "PROGRAMACIÓN FÍSICA" ===
        // Comienza justo después del bloque de Sector
        const progStart = this.numberToColumn(this.columnToNumber(sectorEnd) + 1);
        const progEnd = this.numberToColumn(this.columnToNumber(progStart) + 4); // 5 columnas
        ws.mergeCells(`${progStart}3:${progEnd}3`);
        const progCell = ws.getCell(`${progStart}3`);
        progCell.value = 'Programación Física Meta Producto';
        progCell.font = { size: 12, bold: true, name: 'Arial' } as any;
        progCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } as any;
        progCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } } as any;
        progCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        } as any;

        // === SEGUNDA FILA DE HEADERS (fila 4) - Sub-headers específicos ===
        // Headers del enfoque poblacional
        // Pintar sub-headers dinámicos para enfoques
        const enfoqueColumns: { col: string; id: number }[] = [];
        if (enfoques.length === 0) {
            const cell = ws.getCell(`${enfoqueStart}4`);
            cell.value = '—';
            this.applySubHeaderStyle(cell);
            enfoqueColumns.push({ col: enfoqueStart, id: -1 });
        } else {
            enfoques.forEach((e: { id: number; nombre: string }, idx: number) => {
                const col = this.numberToColumn(this.columnToNumber(enfoqueStart) + idx);
                const cell = ws.getCell(`${col}4`);
                cell.value = e.nombre;
                this.applySubHeaderStyle(cell);
                enfoqueColumns.push({ col, id: Number(e.id) });
            });
        }
        // Guardar mapping para usar al escribir filas
        this.enfoquePoblacionalColumns = enfoqueColumns;

        // Headers de Sector
        const sectorHeaders = ['Urbano', 'Rural'];
        const sectorCols = [sectorStart, this.numberToColumn(this.columnToNumber(sectorStart) + 1)];
        sectorHeaders.forEach((text, idx) => {
            const cell = ws.getCell(`${sectorCols[idx]}4`);
            cell.value = text;
            this.applySubHeaderStyle(cell);
        });
        this.sectorColumns = sectorCols;

        // Headers de programación física
        const progHeaders = ['Pr. 2024', 'Pr. 2025', 'Pr. 2026', 'Pr. 2027', 'Pr. 2028'];
        const progCols = Array.from({ length: 5 }, (_, i) => this.numberToColumn(this.columnToNumber(progStart) + i));

        progHeaders.forEach((text, idx) => {
            const cell = ws.getCell(`${progCols[idx]}4`);
            cell.value = text;
            this.applySubHeaderStyle(cell);
        });
        this.progColumns = progCols;

        // Altura de filas para mejorar legibilidad
        ws.getRow(3).height = 28;
        ws.getRow(4).height = 40;

        // === HEADER "SEGUIMIENTO EJECUCIÓN FISICA" ===
        const SeguiFisico = [
            'Ej. 2024', 'Avance Físico (%) 2024', 'No Acumulada (IM) 2024', 'Acumulada (MA) 2024', 'Rango 2024', 'Observación 2024',
            'Ej. 2025', 'Avance Físico (%) 2025', 'No Acumulada (IM) 2025', 'Acumulada (MA) 2025', 'Rango 2025', 'Observación 2025',
            'Ej. 2026', 'Avance Físico (%) 2026', 'No Acumulada (IM) 2026', 'Acumulada (MA) 2026', 'Rango 2026', 'Observación 2026',
            'Ej. 2027', 'Avance Físico (%) 2027', 'No Acumulada (IM) 2027', 'Acumulada (MA) 2027', 'Rango 2027', 'Observación 2027',
            'Ej. 2028', 'Avance Físico (%) 2028', 'Rango 2028', 'Observación 2028'
        ];
        // === HEADER AGRUPADO: SEGUIMIENTO EJECUCIÓN FÍSICA META PRODUCTO ===
        // Comienza inmediatamente después de Programación Física y ocupa tantas columnas como headers tenga
        const segStart = this.numberToColumn(this.columnToNumber(progEnd) + 1);
        const segEnd = this.numberToColumn(this.columnToNumber(segStart) + (SeguiFisico.length - 1));
        ws.mergeCells(`${segStart}3:${segEnd}3`);
        const segFisicaCell = ws.getCell(`${segStart}3`);
        segFisicaCell.value = 'Seguimiento Ejecución Física Meta Producto';
        segFisicaCell.font = { size: 12, bold: true, name: 'Arial' } as any;
        segFisicaCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } as any;
        segFisicaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } } as any;
        segFisicaCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } as any;
        const SeguiFisicoCols = Array.from({ length: SeguiFisico.length }, (_, i) => this.numberToColumn(this.columnToNumber(segStart) + i));

        SeguiFisico.forEach((text, idx) => {
            const cell = ws.getCell(`${SeguiFisicoCols[idx]}4`);
            cell.value = text;
            this.applySubHeaderStyle(cell);
        });

        // === SUB-BLOQUES: FUENTES DE FINANCIACIÓN POR AÑO ===
        // Construimos dinámicamente headers para 2024-2027 con las fuentes disponibles,
        // colocándolos CONTIGUOS sin columnas vacías entre bloques.
        const colAdvance = (col: string, offset: number) => {
            const base = this.columnToNumber(col);
            return this.numberToColumn(base + offset);
        };

        // Ajustar ancho para el bloque de seguimiento
        for (let c = this.columnToNumber(segStart); c <= this.columnToNumber(segEnd); c++) {
            ws.getColumn(c).width = 16;
        }

        const anos = ['2024', '2025', '2026', '2027'];
        let currStart = this.numberToColumn(this.columnToNumber(segEnd) + 1); // Empieza justo después del bloque de seguimiento
        let lastCol = segEnd;
        let firstFinStart: string | undefined;
        let lastFinEnd: string | undefined;
        for (const ano of anos) {
            const numCols = Math.max(1, fuentesFinanciacion.length);
            const endCol = colAdvance(currStart, numCols - 1);
            ws.mergeCells(`${currStart}3:${endCol}3`);
            const headerCell = ws.getCell(`${currStart}3`);
            headerCell.value = `Fuentes de Financiación ${ano}`;
            this.applyHeaderStyle(headerCell, 'FF90EE90');

            if (fuentesFinanciacion.length === 0) {
                const cell = ws.getCell(`${currStart}4`);
                cell.value = '—';
                this.applySubHeaderStyle(cell);
                ws.getColumn(this.columnToNumber(currStart)).width = 18;
            } else {
                fuentesFinanciacion.forEach((f, i) => {
                    const col = colAdvance(currStart, i);
                    const cell = ws.getCell(`${col}4`);
                    cell.value = f.nombre;
                    this.applySubHeaderStyle(cell);
                    ws.getColumn(this.columnToNumber(col)).width = 18;
                });
            }

            if (!firstFinStart) firstFinStart = currStart;
            lastFinEnd = endCol;
            lastCol = endCol;
            currStart = colAdvance(endCol, 1);
        }

        // Agregar columna de Total Cuatrienio 2024-2027
        const totalCol = currStart; // siguiente columna
        ws.mergeCells(`${totalCol}3:${totalCol}4`);
        const totalHeaderCell = ws.getCell(`${totalCol}3`);
        totalHeaderCell.value = 'Total Cuatrienio 2024 - 2027';
        this.applyHeaderStyle(totalHeaderCell, 'FF90EE90');
        ws.getColumn(totalCol).width = 18;
        lastCol = totalCol;

        // === APLICAR MERGE A LOS HEADERS PRINCIPALES PARA QUE ABARQUEN DOS FILAS ===
        // Para que los headers principales (A-X) se vean bien, necesitamos hacer merge vertical
        mainCols.forEach(col => {
            ws.mergeCells(`${col}3:${col}4`);
            const cell = ws.getCell(`${col}3`);
            // Reaplicar el estilo después del merge
            this.applyHeaderStyle(cell, 'FFE6F5E6');
        });

        return { lastCol, finStart: firstFinStart, finEnd: lastFinEnd, totalCol };
    }

    // Nuevo método para el estilo de sub-headers
    private applySubHeaderStyle(cell: ExcelJS.Cell) {
        cell.font = { size: 9, bold: true, name: 'Arial' } as any;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } as any;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } as any;
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        } as any;
    }

    private applyHeaderStyle(cell: ExcelJS.Cell, bgColor = 'FFE6E6E6') {
        cell.font = { size: 10, bold: true, name: 'Arial' } as any;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } as any;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } } as any;
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } as any;
    }

    private applyRowBorders(ws: ExcelJS.Worksheet, row: number, startCol: string, endCol: string) {
        const s = this.columnToNumber(startCol);
        const e = this.columnToNumber(endCol);
        for (let c = s; c <= e; c++) {
            const cell = ws.getCell(row, c);
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } as any;
            cell.font = { size: 9, name: 'Arial' } as any;
            cell.alignment = { vertical: 'middle', wrapText: true } as any;
        }
    }

    private configureColumnWidths(ws: ExcelJS.Worksheet) {
        const w: Record<string, number> = {
            A: 6, B: 26, C: 28, D: 30, E: 12, F: 12, G: 16, H: 16, I: 26, J: 26, K: 28, L: 22, M: 16, N: 16, O: 24, P: 18, Q: 24, R: 16, S: 22, T: 16, U: 18, V: 12, W: 12, X: 18, Y: 18,
            Z: 10, AA: 10, AB: 14, AC: 12, AD: 12, AE: 14, AF: 10, AG: 12, AH: 14, AI: 10, AJ: 10, AK: 12, AL: 12, AM: 12, AN: 12, AO: 12,
            AP: 12, AQ: 16, AR: 16, AS: 16, AT: 12, AU: 24, AV: 12, AW: 16, AX: 16, AY: 16, AZ: 12, BA: 24
        };
        for (const [col, width] of Object.entries(w)) ws.getColumn(col).width = width;
    }
    private columnToNumber(col: string) { let r = 0; for (let i = 0; i < col.length; i++) r = r * 26 + (col.charCodeAt(i) - 64); return r; }
    private numberToColumn(num: number) { let s = ''; while (num > 0) { const m = (num - 1) % 26; s = String.fromCharCode(65 + m) + s; num = Math.floor((num - 1) / 26); } return s; }

    private async fetchFuentesFinanciacion(): Promise<{ id: number; nombre: string }[]> {
        const { data } = await this.supabaseService.clientAdmin
            .from('fuentes_financiacion')
            .select('id, nombre')
            .order('id');
        return (data || []).map((d: any) => ({ id: Number(d.id), nombre: String(d.nombre) }));
    }
    private async fetchAreasById(snapshot: any): Promise<Map<number, string>> {
        const metas = Array.isArray(snapshot.meta_producto) ? snapshot.meta_producto : [];
        const ids = Array.from(new Set(metas.map((m: any) => Number(m.area_id)).filter(Boolean)));
        if (ids.length === 0) return new Map();
        const { data, error } = await this.supabaseService.clientAdmin
            .from('area')
            .select('id, nombre')
            .in('id', ids);
        if (error) return new Map();
        const map = new Map<number, string>();
        for (const a of data || []) map.set(Number(a.id), a.nombre as string);
        return map;
    }

    private async fetchMetaResultadoYLineas(snapshot: any) {
        const metas = Array.isArray(snapshot.meta_producto) ? snapshot.meta_producto : [];
        const metaIds = metas.map((m: any) => Number(m.id));
        const relacionesRes = await this.supabaseService.clientAdmin
            .from('metas_resultado_producto')
            .select('meta_producto_id, meta_resultado_id')
            .in('meta_producto_id', metaIds);
        const metasByMetaProductoId = new Map<number, number[]>();
        if (!relacionesRes.error) {
            for (const r of relacionesRes.data || []) {
                const arr = metasByMetaProductoId.get(Number(r.meta_producto_id)) || [];
                arr.push(Number(r.meta_resultado_id));
                metasByMetaProductoId.set(Number(r.meta_producto_id), arr);
            }
        }

        const metaResultadoIds = Array.from(new Set((relacionesRes.data || []).map((r: any) => Number(r.meta_resultado_id))));
        const metaResultadoById = new Map<number, any>();
        if (metaResultadoIds.length > 0) {
            const { data: mrData } = await this.supabaseService.clientAdmin
                .from('meta_resultado')
                .select('id, nombre, linea_base, "año_linea_base", meta_cuatrienio, fuente, linea_estrategica_id')
                .in('id', metaResultadoIds);
            for (const mr of mrData || []) metaResultadoById.set(Number(mr.id), mr);
        }

        const lineaIds = Array.from(new Set(Array.from(metaResultadoById.values()).map((mr: any) => Number(mr.linea_estrategica_id)).filter(Boolean)));
        const lineaById = new Map<number, any>();
        if (lineaIds.length > 0) {
            const { data: leData } = await this.supabaseService.clientAdmin
                .from('linea_estrategica')
                .select('id, nombre, plan_nacional, plan_departamental')
                .in('id', lineaIds);
            for (const le of leData || []) lineaById.set(Number(le.id), le);
        }

        return { metasByMetaProductoId, metaResultadoById, lineaById };
    }

    private async fetchMgaById(snapshot: any): Promise<Map<number, any>> {
        const metas = Array.isArray(snapshot.meta_producto) ? snapshot.meta_producto : [];
        const ids = Array.from(new Set(metas.map((m: any) => Number(m.caracterizacion_mga_id)).filter(Boolean)));
        if (ids.length === 0) return new Map();
        const { data } = await this.supabaseService.clientAdmin
            .from('caracterizacion_mga')
            .select('id, sector, programa, producto, codigo_indicador, indicador_producto, unidad_medida_indicador, unidad_medida_producto')
            .in('id', ids);
        const map = new Map<number, any>();
        for (const r of data || []) map.set(Number(r.id), r);
        return map;
    }

    private async fetchOdsById(snapshot: any): Promise<Map<number, string>> {
        const metas = Array.isArray(snapshot.meta_producto) ? snapshot.meta_producto : [];
        const ids = Array.from(new Set(metas.map((m: any) => Number(m.ods_id)).filter(Boolean)));
        if (ids.length === 0) return new Map();
        const { data } = await this.supabaseService.clientAdmin
            .from('ods')
            .select('id, nombre')
            .in('id', ids);
        const map = new Map<number, string>();
        for (const r of data || []) map.set(Number(r.id), r.nombre as string);
        return map;
    }

    private async fetchEnfoquePoblacionalIdsByMeta(snapshot: any): Promise<Map<number, number[]>> {
        const metas = Array.isArray(snapshot.meta_producto) ? snapshot.meta_producto : [];
        const metaIds = metas.map((m: any) => Number(m.id));
        const map = new Map<number, number[]>();
        if (metaIds.length === 0) return map;
        const { data, error } = await this.supabaseService.clientAdmin
            .from('meta_producto_enfoque_poblacional')
            .select('meta_producto_id, enfoque_poblacional_id')
            .in('meta_producto_id', metaIds);
        if (error) return map;
        for (const r of data || []) {
            const key = Number(r.meta_producto_id);
            const arr = map.get(key) || [];
            arr.push(Number(r.enfoque_poblacional_id));
            map.set(key, arr);
        }
        return map;
    }
    private async fetchFirstProgramaByLinea(lineaIds: number[]): Promise<Map<number, string>> {
        if (lineaIds.length === 0) return new Map();
        const { data, error } = await this.supabaseService.clientAdmin
            .from('programa')
            .select('id, nombre, linea_estrategica_id')
            .in('linea_estrategica_id', lineaIds)
            .order('id', { ascending: true });
        if (error) return new Map();
        const map = new Map<number, string>();
        for (const p of data || []) {
            const key = Number(p.linea_estrategica_id);
            if (!map.has(key)) map.set(key, p.nombre as string);
        }
        return map;
    }

    // Cache y fetch de Enfoque Poblacional
    private cachedEnfoquePoblacional: { id: number; nombre: string }[] | null = null;
    private enfoquePoblacionalColumns: { col: string; id: number }[] = [];
    private async fetchEnfoquePoblacional(): Promise<{ id: number; nombre: string }[]> {
        if (this.cachedEnfoquePoblacional) return this.cachedEnfoquePoblacional;
        const { data } = await this.supabaseService.clientAdmin
            .from('enfoque_poblacional')
            .select('id, nombre')
            .order('id');
        this.cachedEnfoquePoblacional = (data || []).map((d: any) => ({ id: Number(d.id), nombre: String(d.nombre) }));
        return this.cachedEnfoquePoblacional;
    }
}


