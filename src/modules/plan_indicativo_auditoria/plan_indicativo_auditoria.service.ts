import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PlanIndicativoAuditoriaService {
    constructor(private readonly supabaseService: SupabaseService) { }

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

        this.setupMainTitle(worksheet, fecha);
        this.setupMainHeaders(worksheet);

        const areasById = await this.fetchAreasById(snapshot);
        const { metasByMetaProductoId, lineaById, metaResultadoById } = await this.fetchMetaResultadoYLineas(snapshot);
        const mgaById = await this.fetchMgaById(snapshot);
        const odsById = await this.fetchOdsById(snapshot);
        const firstProgramaByLinea = await this.fetchFirstProgramaByLinea(Array.from(lineaById.keys()));

        const progFisicaByMetaId = new Map<number, any>();
        const progFis = Array.isArray(snapshot.programacion_fisica) ? snapshot.programacion_fisica : [];
        for (const pf of progFis) progFisicaByMetaId.set(Number(pf.meta_id), pf);

        const metasProducto = Array.isArray(snapshot.meta_producto) ? snapshot.meta_producto : [];

        let currentRow = 4;
        for (const mp of metasProducto) {
            const relaciones = metasByMetaProductoId.get(Number(mp.id)) || [];
            const mr = relaciones.length > 0 ? metaResultadoById.get(relaciones[0]) : undefined;
            const linea = mr ? lineaById.get(Number(mr.linea_estrategica_id)) : undefined;
            const pf = progFisicaByMetaId.get(Number(mp.id));

            const sec = currentRow - 3;
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

            const mga = mgaById.get(Number(mp.caracterizacion_mga_id));
            worksheet.getCell(`L${currentRow}`).value = `${mp?.codigo_sector || ''}${mga?.sector ? ' - ' + mga.sector : ''}`;
            worksheet.getCell(`M${currentRow}`).value = mp?.codigo_programa || '';
            worksheet.getCell(`N${currentRow}`).value = odsById.get(Number(mp.ods_id)) || '';
            worksheet.getCell(`O${currentRow}`).value = `${mp?.codigo_producto || ''}${mga?.producto ? ' - ' + mga.producto : ''}`;
            worksheet.getCell(`P${currentRow}`).value = mp?.instrumento_planeacion || '';

            worksheet.getCell(`Q${currentRow}`).value = mp?.nombre || '';
            worksheet.getCell(`R${currentRow}`).value = mga?.codigo_indicador || '';
            worksheet.getCell(`S${currentRow}`).value = mp?.nombre_indicador || mga?.indicador_producto || '';
            worksheet.getCell(`T${currentRow}`).value = mp?.unidad_medida || '';
            worksheet.getCell(`U${currentRow}`).value = (mp as any)?.unidad_medida_indicador_producto || mga?.unidad_medida_indicador || mga?.unidad_medida_producto || '';
            worksheet.getCell(`V${currentRow}`).value = mp?.linea_base ?? '';
            worksheet.getCell(`W${currentRow}`).value = mp?.meta_numerica ?? '';
            worksheet.getCell(`X${currentRow}`).value = mp?.orientacion || '';
            worksheet.getCell(`Y${currentRow}`).value = '';

            if (Array.isArray(mp?.enfoque_poblacional_ids)) {
                if (mp.enfoque_poblacional_ids.length > 0) worksheet.getCell(`Z${currentRow}`).value = 'X';
            }

            if (pf) {
                worksheet.getCell(`AI${currentRow}`).value = pf.periodo_uno ?? 0;
                worksheet.getCell(`AJ${currentRow}`).value = pf.periodo_dos ?? 0;
                worksheet.getCell(`AK${currentRow}`).value = pf.periodo_tres ?? 0;
                worksheet.getCell(`AL${currentRow}`).value = pf.periodo_cuatro ?? 0;
                worksheet.getCell(`AM${currentRow}`).value = pf.total_cuatrienio ?? 0;
            }

            this.applyRowBorders(worksheet, currentRow, 'A', 'AM');
            currentRow++;
        }

        this.configureColumnWidths(worksheet);
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }


    // Estos helpers serán completados en siguientes pasos (se declaran para compilar en etapas)
    private setupMainTitle(ws: ExcelJS.Worksheet, date: Date) {
        ws.mergeCells('A1:AS1');
        const titleCell = ws.getCell('A1');
        titleCell.value = 'PLAN INDICATIVO PLAN MUNICIPAL DE DESARROLLO';
        titleCell.font = { size: 14, bold: true, name: 'Arial' } as any;
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' } as any;
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } } as any;

        ws.mergeCells('A2:AS2');
        const dateCell = ws.getCell('A2');
        dateCell.value = `Estado al: ${date.toLocaleString('es-CO')}`;
        dateCell.font = { size: 10, italic: true, name: 'Arial' } as any;
        dateCell.alignment = { horizontal: 'center' } as any;
    }

    private setupMainHeaders(ws: ExcelJS.Worksheet) {
        const headers = [
            'N° Meta', 'Dependencia Líder', 'Eje Plan Municipal de Desarrollo 2024 - 2028', 'Meta de Resultado', 'Línea Base', 'Año Línea Base', 'Meta 2028', 'Fuente', 'Plan Nacional de Desarrollo', 'Plan Departamental de Desarrollo', 'Programa Plan Municipal de Desarrollo 2024 - 2028', 'Sector MGA (código - nombre)', 'Cód. Programa MGA', 'ODS', 'Cód. Producto MGA', 'Instrumento de Planeación', 'Producto PMD', 'Cód. Indicador MGA', 'Indicador Producto', 'Unidad de Medida', 'Unidad de Medida MGA', 'Línea Base', 'Meta 2028', 'Orientación de la Meta', 'Enfoque Derechos Humanos', 'Mujer', 'LGBTIQ+', 'Primera Infancia', 'Adolescente', 'Juvenil', 'Adulto Mayor', 'Vejez', 'Migrante', 'Discapacidad', 'Pr. 2024', 'Pr. 2025', 'Pr. 2026', 'Pr. 2027', 'Pr. 2028'
        ];
        const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM'];
        headers.forEach((text, idx) => {
            const c = ws.getCell(`${cols[idx]}3`);
            c.value = text;
            this.applyHeaderStyle(c, 'FFE6F5E6');
        });

        const enfoque = ws.getCell('AB3');
        enfoque.value = 'Enfoque Poblacional (Si aplica)';
        enfoque.font = { size: 12, bold: true, name: 'Arial' } as any;
        enfoque.alignment = { horizontal: 'center', vertical: 'middle' } as any;
        enfoque.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } } as any;

        const prog = ws.getCell('AL3');
        prog.value = 'Programación Física Meta Producto';
        prog.font = { size: 12, bold: true, name: 'Arial' } as any;
        prog.alignment = { horizontal: 'center', vertical: 'middle' } as any;
        prog.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } } as any;
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
        const w: Record<string, number> = { A: 6, B: 26, C: 28, D: 30, E: 12, F: 12, G: 16, H: 16, I: 26, J: 26, K: 28, L: 22, M: 16, N: 16, O: 24, P: 18, Q: 24, R: 16, S: 22, T: 16, U: 18, V: 12, W: 12, X: 18, Y: 18, Z: 10, AA: 10, AB: 14, AC: 12, AD: 12, AE: 14, AF: 10, AG: 12, AH: 14, AI: 10, AJ: 10, AK: 10, AL: 10, AM: 10 };
        for (const [col, width] of Object.entries(w)) ws.getColumn(col).width = width;
    }
    private columnToNumber(col: string) { let r = 0; for (let i = 0; i < col.length; i++) r = r * 26 + (col.charCodeAt(i) - 64); return r; }
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
}


