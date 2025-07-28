import { ModuloConfig } from 'src/modules/area/dto/area.dto';

export const MODULOS_DISPONIBLES = [
  {
    id: 'entidad-territorial',
    nombre: 'Entidad Territorial',
    descripcion: 'Gestión de entidad territorial',
    submodulos: [],
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    descripcion: 'Gestión de usuarios, roles y dependencias',
    submodulos: ['usuarios', 'roles', 'dependencias'],
  },
  {
    id: 'catalogo',
    nombre: 'Catálogo',
    descripcion: 'Gestión de catálogos del sistema',
    submodulos: [
      'mga',
      'fuentes-financiacion',
      'enfoque-poblacional',
      'ods',
    ],
  },
  {
    id: 'plan-indicativo',
    nombre: 'Plan Indicativo',
    descripcion: 'Gestión del plan indicativo',
    submodulos: [
      'lineas-estrategicas',
      'programas',
      'metas-resultados',
      'metas-productos',
      'programacion-fisica',
      'programacion-financiera',
    ],
  },
  {
    id: 'poai',
    nombre: 'POAI',
    descripcion: 'Gestión del Plan Operativo Anual de Inversiones',
    submodulos: [
      'banco-proyectos',
      'topes-presupuestales',
      'programacion-financiera-poai',
      'programacion-fisica-poai',
    ],
  },
];

// Estructura dinámica - cada módulo tiene su propio estado
export type AreaModulos = Record<string, ModuloConfig>;

// Función para validar estructura de módulos
export const validarModulosArea = (modulos: any): AreaModulos => {
  const modulosValidados: AreaModulos = {};

  // Si no se envían módulos, devolver objeto vacío
  if (!modulos || typeof modulos !== 'object') {
    return modulosValidados;
  }

  // Procesar SOLO los módulos que se envíen
  const modulosDisponiblesIds = MODULOS_DISPONIBLES.map((m) => m.id);

  for (const moduloId in modulos) {
    if (modulosDisponiblesIds.includes(moduloId)) {
      const moduloEnviado = modulos[moduloId];
      const moduloDisponible = MODULOS_DISPONIBLES.find(
        (m) => m.id === moduloId,
      );

      if (moduloEnviado && typeof moduloEnviado === 'object') {
        modulosValidados[moduloId] = {
          activo: Boolean(moduloEnviado.activo),
          submodulos: Array.isArray(moduloEnviado.submodulos)
            ? moduloEnviado.submodulos.filter((sub) =>
                moduloDisponible?.submodulos.includes(sub),
              )
            : [],
        };
      }
    }
  }

  return modulosValidados;
};
