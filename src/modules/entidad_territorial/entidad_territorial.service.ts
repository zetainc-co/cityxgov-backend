import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from 'src/config/supabase/supabase.service';
import {
    EntidadTerritorial,
    EntidadTerritorialRequest,
    EntidadTerritorialResponse
} from './dto/entidad_territorial.dto';

@Injectable()
export class EntidadTerritorialService {
    constructor(private supabaseService: SupabaseService) { }

    // Obtiene LA entidad territorial (solo hay una por sistema)
    async getEntidad(): Promise<EntidadTerritorialResponse> {
        try {
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('entidad_territorial')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

            if (error) {
                throw new InternalServerErrorException('Error al obtener entidad territorial: ' + error.message);
            }

            if (!data) {
                return {
                    status: false,
                    message: 'No hay entidad territorial configurada. Debes crear una primero.',
                    data: undefined
                }
            }

            return {
                status: true,
                message: 'Entidad territorial encontrada correctamente',
                data: data,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al obtener entidad territorial',
                error: error.message
            };
        }
    }



    // Crea LA entidad territorial (solo puede haber una)
    async createEntidad(createRequest: EntidadTerritorialRequest): Promise<EntidadTerritorialResponse> {
        try {
            // Verificar si ya existe una entidad territorial
            const { data: existingEntity, error: checkError } =
            await this.supabaseService.clientAdmin
            .from('entidad_territorial')
            .select('id')
            .limit(1)
            .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar entidad territorial: ' + checkError.message);
            }

            if (existingEntity) {
                return {
                    status: false,
                    message: 'Ya existe una entidad territorial. Solo puede haber una por sistema. Usa el endpoint de actualización.',
                    error: 'Entidad ya existe'
                }
            }

            // Crear la entidad territorial (acepta cualquier string en campos de ubicación)
            const { data, error } =
                await this.supabaseService.clientAdmin
                    .from('entidad_territorial')
                    .insert(createRequest)
                    .select()
                    .single();

            if (error) {
                throw new InternalServerErrorException('Error al crear entidad territorial: ' + error.message);
            }

            return {
                status: true,
                message: 'Entidad territorial creada correctamente',
                data: data,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al crear entidad territorial',
                error: error.message,
                data: []
            };
        }
    }

    // Actualiza LA entidad territorial (busca la única que existe)
    async updateEntidad(updateRequest: EntidadTerritorialRequest): Promise<EntidadTerritorialResponse> {
        try {
            // Obtener la entidad territorial existente (solo hay una)
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar entidad territorial: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: 'No existe una entidad territorial configurada. Debes crear una primero.',
                    error: 'Entidad no encontrada',
                    data: []
                }
            }

            // Actualizar la entidad territorial
            const { data, error } = await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .update({
                    ...updateRequest,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingData.id)
                .select()
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar entidad territorial: ' + error.message);
            }

            return {
                status: true,
                message: 'Entidad territorial actualizada correctamente',
                data: data,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al actualizar entidad territorial',
                error: error.message,
                data: []
            };
        }
    }



    // ============ MÉTODOS PARA ORGANIGRAMA ============

    // Obtener organigrama de LA entidad territorial
    async getOrganigrama(): Promise<EntidadTerritorialResponse> {
        try {
            const { data, error } = await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .select('id, nombre_entidad, organigrama')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                throw new InternalServerErrorException('Error al obtener organigrama: ' + error.message);
            }

            if (!data) {
                return {
                    status: false,
                    message: 'No existe una entidad territorial configurada. Debes crear una primero.',
                    error: 'Entidad no encontrada',
                    data: undefined
                };
            }

            return {
                status: true,
                message: 'Organigrama obtenido correctamente',
                data: data as any,
                error: null
            };
        } catch (error) {
            return {
                status: false,
                message: 'Error al obtener organigrama',
                error: error.message
            };
        }
    }

    // Actualizar organigrama de LA entidad territorial
    async updateOrganigrama(organigrama: any): Promise<EntidadTerritorialResponse> {
        try {
            // Obtener la entidad territorial existente (solo hay una)
            const { data: existingData, error: checkError } = await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar entidad territorial: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: 'No existe una entidad territorial configurada. Debes crear una primero.',
                    error: 'Entidad no encontrada',
                    data: undefined
                };
            }

            // Validar que el organigrama sea un objeto válido
            if (typeof organigrama !== 'object' || organigrama === null) {
                return {
                    status: false,
                    message: 'El organigrama debe ser un objeto JSON válido',
                    error: 'Formato inválido'
                };
            }

            // Actualizar solo el organigrama
            const { data, error } = await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .update({
                    organigrama: organigrama,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingData.id)
                .select('id, nombre_entidad, organigrama, updated_at')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al actualizar organigrama: ' + error.message);
            }

            return {
                status: true,
                message: 'Organigrama actualizado correctamente',
                data: data as any,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al actualizar organigrama',
                error: error.message
            };
        }
    }

    // ============ MÉTODOS DE ELIMINACIÓN ============

    // Eliminar LA entidad territorial completa
    async deleteEntidad(): Promise<EntidadTerritorialResponse> {
        try {
            // Obtener la entidad territorial existente (solo hay una)
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar entidad territorial: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: 'No existe una entidad territorial configurada para eliminar.',
                    error: 'Entidad no encontrada',
                    data: undefined
                }
            }

            // Eliminar entidad territorial
            const { error } = await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .delete()
                .eq('id', existingData.id);

            if (error) {
                throw new InternalServerErrorException('Error al eliminar entidad territorial: ' + error.message);
            }

            return {
                status: true,
                message: 'Entidad territorial eliminada correctamente',
                data: existingData,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al eliminar entidad territorial',
                error: error.message,
                data: undefined
            };
        }
    }

    // Eliminar solo el organigrama (mantener la entidad)
    async deleteOrganigrama(): Promise<EntidadTerritorialResponse> {
        try {
            // Obtener la entidad territorial existente (solo hay una)
            const { data: existingData, error: checkError } =
            await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (checkError) {
                throw new InternalServerErrorException('Error al verificar entidad territorial: ' + checkError.message);
            }

            if (!existingData) {
                return {
                    status: false,
                    message: 'No existe una entidad territorial configurada.',
                    error: 'Entidad no encontrada',
                    data: undefined
                }
            }

            // Eliminar solo el organigrama (ponerlo en null)
            const { data, error } = await this.supabaseService.clientAdmin
                .from('entidad_territorial')
                .update({
                    organigrama: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingData.id)
                .select('id, nombre_entidad, organigrama, updated_at')
                .single();

            if (error) {
                throw new InternalServerErrorException('Error al eliminar organigrama: ' + error.message);
            }

            return {
                status: true,
                message: 'Organigrama eliminado correctamente. La entidad territorial se mantiene.',
                data: data as any,
                error: null
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            return {
                status: false,
                message: 'Error al eliminar organigrama',
                error: error.message
            };
        }
    }

}
