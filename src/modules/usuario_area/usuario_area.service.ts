// import {
//     Injectable,
//     InternalServerErrorException,
// } from '@nestjs/common';
// import { SupabaseService } from 'src/config/supabase/supabase.service';
// import {
//     UsuarioAreaResponse,
//     UsuarioConAsignaciones,
//     AsignacionExpanded,
//     Usuario,
//     UsuarioAreaUpdateData,
//     UsuarioAreaRequest,
// } from './dto/usuario_area.dto';

// @Injectable()
// export class UsuarioAreaService {
//     constructor(private readonly supabaseService: SupabaseService) { }

//     // Obtiene todas las asignaciones de todos los usuarios con asignaciones
//     async findAll(): Promise<UsuarioAreaResponse> {
//         try {
//             const { data, error } =
//                 await this.supabaseService.clientAdmin
//                     .from('usuario_area')
//                     .select(`
//                         id,
//                         usuario_id,
//                         area_id,
//                         rol_id,
//                         created_at,
//                         updated_at,
//                         usuarios:usuario_id!inner (
//                             id,
//                             identificacion,
//                             nombre,
//                             apellido,
//                             correo,
//                             telefono,
//                             avatar,
//                             activo
//                         ),
//                         area:area_id!inner (
//                             id,
//                             nombre,
//                             descripcion
//                         ),
//                         rol:rol_id!inner (
//                             id,
//                             nombre,
//                             descripcion
//                         )
//                     `)
//                     .order('created_at', { ascending: false });
//             if (error) {
//                 console.error('Supabase error:', error);
//                 throw new InternalServerErrorException('Error al obtener asignaciones: ' + error.message);
//             }

//             if (!data || data.length === 0) {
//                 return {
//                     status: 200,
//                     message: 'No se encontraron asignaciones',
//                     data: []
//                 };
//             }
//             // Agrupar asignaciones por usuario
//             const usuarioMap = new Map<number, UsuarioConAsignaciones>();

//             data.forEach(usuarioArea => {
//                 const usuario = Array.isArray(usuarioArea.usuarios) ? usuarioArea.usuarios[0] : usuarioArea.usuarios;
//                 const area = Array.isArray(usuarioArea.area) ? usuarioArea.area[0] : usuarioArea.area;
//                 const rol = Array.isArray(usuarioArea.rol) ? usuarioArea.rol[0] : usuarioArea.rol;

//                 const asignacion: AsignacionExpanded = {
//                     id: usuarioArea.id,
//                     area: area || null,
//                     rol: rol || null,
//                     created_at: usuarioArea.created_at,
//                     updated_at: usuarioArea.updated_at
//                 };

//                 if (!usuarioMap.has(usuario.id)) {
//                     usuarioMap.set(usuario.id, {
//                         usuario: usuario,
//                         asignaciones: []
//                     });
//                 }

//                 usuarioMap.get(usuario.id)?.asignaciones.push(asignacion);
//             });

//             // Ordenar las asignaciones de cada usuario
//             for (const usuarioData of usuarioMap.values()) {
//                 usuarioData.asignaciones.sort((a, b) => {
//                     if (a.area && b.area) {
//                         const areaCompare = a.area.nombre.localeCompare(b.area.nombre);
//                         if (areaCompare !== 0) return areaCompare;
//                     }
//                     if (a.rol && b.rol) {
//                         return a.rol.nombre.localeCompare(b.rol.nombre);
//                     }
//                     return 0;
//                 });
//             }

//             return {
//                 status: 200,
//                 message: 'Asignaciones encontradas correctamente',
//                 data: Array.from(usuarioMap.values())
//             };
//         } catch (error) {
//             console.error('Service error:', error);
//             return {
//                 status: 500,
//                 message: 'Error al obtener asignaciones',
//                 error: error.message
//             };
//         }
//     }

//     // Obtener asignaciones de un usuario
//     async findByUser(userId: number): Promise<UsuarioAreaResponse> {
//         try {
//             console.log('Buscando asignaciones para usuario:', userId);

//             const { data, error } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .select(`
//                     id,
//                     usuario_id,
//                     area_id,
//                     rol_id,
//                     created_at,
//                     updated_at,
//                     usuarios:usuario_id (
//                         id,
//                         identificacion,
//                         nombre,
//                         apellido,
//                         correo,
//                         telefono,
//                         avatar,
//                         activo
//                     ),
//                     area:area_id (
//                         id,
//                         nombre,
//                         descripcion
//                     ),
//                     rol:rol_id (
//                         id,
//                         nombre,
//                         descripcion
//                     )
//                 `)
//                 .eq('usuario_id', userId);

//             if (error) {
//                 console.error('Supabase error:', error);
//                 throw new InternalServerErrorException('Error al obtener asignaciones del usuario: ' + error.message);
//             }

//             if (!data || data.length === 0) {
//                 // Verificar si el usuario existe
//                 const { data: userExists } = await this.supabaseService.clientAdmin
//                     .from('usuarios')
//                     .select('id, identificacion, nombre, apellido, correo, telefono, avatar, activo')
//                     .eq('id', userId)
//                     .single();

//                 if (!userExists) {
//                     return {
//                         status: 404,
//                         message: 'El usuario especificado no existe',
//                         data: []
//                     };
//                 }

//                 const usuario: Usuario = {
//                     id: userExists.id,
//                     identificacion: userExists.identificacion,
//                     nombre: userExists.nombre,
//                     apellido: userExists.apellido,
//                     correo: userExists.correo,
//                     telefono: userExists.telefono,
//                     avatar: userExists.avatar,
//                     activo: userExists.activo
//                 };

//                 return {
//                     status: 200,
//                     message: `El usuario ${usuario.nombre} ${usuario.apellido} no tiene asignaciones`,
//                     data: [{
//                         usuario: usuario,
//                         asignaciones: []
//                     }]
//                 };
//             }

//             // Obtener los datos del usuario de la primera asignación
//             const userData = Array.isArray(data[0].usuarios) ? data[0].usuarios[0] : data[0].usuarios;

//             // Procesar las asignaciones
//             const asignaciones = data.map(usuarioArea => {
//                 const area = Array.isArray(usuarioArea.area) ? usuarioArea.area[0] : usuarioArea.area;
//                 const rol = Array.isArray(usuarioArea.rol) ? usuarioArea.rol[0] : usuarioArea.rol;

//                 return {
//                     id: usuarioArea.id,
//                     area: area || null,
//                     rol: rol || null,
//                     created_at: usuarioArea.created_at,
//                     updated_at: usuarioArea.updated_at
//                 };
//             });

//             // Ordenar las asignaciones por área y rol
//             asignaciones.sort((a, b) => {
//                 if (a.area && b.area) {
//                     const areaCompare = a.area.nombre.localeCompare(b.area.nombre);
//                     if (areaCompare !== 0) return areaCompare;
//                 }
//                 if (a.rol && b.rol) {
//                     return a.rol.nombre.localeCompare(b.rol.nombre);
//                 }
//                 return 0;
//             });

//             // Crear el objeto de respuesta agrupado
//             const usuarioConAsignaciones = {
//                 usuario: userData,
//                 asignaciones: asignaciones
//             };

//             const userName = userData ? `${userData.nombre} ${userData.apellido}` : `ID: ${userId}`;
//             return {
//                 status: 200,
//                 message: `Se encontraron ${asignaciones.length} asignaciones para el usuario ${userName}`,
//                 data: [usuarioConAsignaciones]
//             };
//         } catch (error) {
//             console.error('Service error:', error);
//             return {
//                 status: 500,
//                 message: 'Error al obtener asignaciones del usuario',
//                 error: error.message
//             };
//         }
//     }

//     // Crear nueva asignación
//     async create(createRequest: UsuarioAreaRequest): Promise<UsuarioAreaResponse> {
//         try {
//             console.log('Payload recibido en /usuario-area:', createRequest);
//             // Verificar si el usuario existe
//             const { data: userExists, error: userError } = await this.supabaseService.clientAdmin
//                 .from('usuarios')
//                 .select('id, identificacion, nombre, apellido, correo, telefono, avatar, activo')
//                 .eq('id', createRequest.usuarioArea.usuario_id)
//                 .single();

//             if (userError || !userExists) {
//                 return {
//                     status: 404,
//                     message: 'El usuario especificado no existe',
//                     data: []
//                 };
//             }

//             // Verificar si el área existe
//             const { data: areaExists, error: areaError } = await this.supabaseService.clientAdmin
//                 .from('area')
//                 .select('*')
//                 .eq('id', createRequest.usuarioArea.area_id)
//                 .single();

//             if (areaError || !areaExists) {
//                 return {
//                     status: 404,
//                     message: 'El área especificada no existe',
//                     data: []
//                 };
//             }

//             // Verificar si el rol existe
//             const { data: rolExists, error: rolError } = await this.supabaseService.clientAdmin
//                 .from('rol')
//                 .select('*')
//                 .eq('id', createRequest.usuarioArea.rol_id)
//                 .single();

//             if (rolError || !rolExists) {
//                 return {
//                     status: 404,
//                     message: 'El rol especificado no existe',
//                     data: []
//                 };
//             }

//             // Verificar si ya existe la asignación
//             const { data: existingAssignment, error: existingError } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .select('*')
//                 .eq('usuario_id', createRequest.usuarioArea.usuario_id)
//                 .eq('area_id', createRequest.usuarioArea.area_id)
//                 .eq('rol_id', createRequest.usuarioArea.rol_id)
//                 .single();

//             if (existingAssignment) {
//                 return {
//                     status: 400,
//                     message: 'Ya existe una asignación con estos valores',
//                     data: []
//                 };
//             }

//             // Crear la asignación
//             const { data, error } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .insert([createRequest.usuarioArea])
//                 .select(`
//                     id,
//                     created_at,
//                     updated_at
//                 `)
//                 .single();

//             if (error) {
//                 console.error('Error creating assignment:', error);
//                 throw new InternalServerErrorException('Error al crear la asignación: ' + error.message);
//             }

//             const usuarioConAsignacion: UsuarioConAsignaciones = {
//                 usuario: userExists,
//                 asignaciones: [{
//                     id: data.id,
//                     area: areaExists,
//                     rol: rolExists,
//                     created_at: data.created_at,
//                     updated_at: data.updated_at
//                 }]
//             };

//             return {
//                 status: 201,
//                 message: `Asignación creada correctamente para ${userExists.nombre} ${userExists.apellido}`,
//                 data: [usuarioConAsignacion]
//             };
//         } catch (error) {
//             console.error('Service error:', error);
//             return {
//                 status: 500,
//                 message: 'Error al crear la asignación',
//                 error: error.message
//             };
//         }
//     }

//     // Actualizar una asignación específica
//     async update(
//         id: number,
//         updateData: { area_id?: number; rol_id?: number }
//     ): Promise<UsuarioAreaResponse> {
//         try {
//             // 1. Verificar que la asignación exista
//             const { data: existingAssignment, error: getError } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .select('*')
//                 .eq('id', id)
//                 .single();

//             if (getError || !existingAssignment) {
//                 return {
//                     status: 404,
//                     message: 'No se encontró la asignación especificada',
//                     data: []
//                 };
//             }

//             // 2. Verificar que el área exista (si se va a actualizar)
//             if (updateData.area_id) {
//                 const { data: areaExists, error: areaError } = await this.supabaseService.clientAdmin
//                     .from('area')
//                     .select('id')
//                     .eq('id', updateData.area_id)
//                     .single();
//                 if (areaError || !areaExists) {
//                     return {
//                         status: 404,
//                         message: 'El área especificada no existe',
//                         data: []
//                     };
//                 }
//             }

//             // 3. Verificar que el rol exista (si se va a actualizar)
//             if (updateData.rol_id) {
//                 const { data: rolExists, error: rolError } = await this.supabaseService.clientAdmin
//                     .from('rol')
//                     .select('id')
//                     .eq('id', updateData.rol_id)
//                     .single();
//                 if (rolError || !rolExists) {
//                     return {
//                         status: 404,
//                         message: 'El rol especificado no existe',
//                         data: []
//                     };
//                 }
//             }

//             // 4. Actualizar la asignación
//             const { data: updated, error: updateError } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .update(updateData)
//                 .eq('id', id)
//                 .select(`
//                 id,
//                 usuario_id,
//                 area_id,
//                 rol_id,
//                 created_at,
//                 updated_at,
//                 usuarios:usuario_id (
//                     id,
//                     identificacion,
//                     nombre,
//                     apellido,
//                     correo,
//                     telefono,
//                     avatar,
//                     activo
//                 ),
//                 area:area_id (
//                     id,
//                     nombre,
//                     descripcion
//                 ),
//                 rol:rol_id (
//                     id,
//                     nombre,
//                     descripcion
//                 )
//             `)
//                 .single();

//             if (updateError) {
//                 throw new InternalServerErrorException('Error al actualizar la asignación: ' + updateError.message);
//             }

//             const usuario = Array.isArray(updated.usuarios) ? updated.usuarios[0] : updated.usuarios;
//             const area = Array.isArray(updated.area) ? updated.area[0] : updated.area;
//             const rol = Array.isArray(updated.rol) ? updated.rol[0] : updated.rol;

//             const usuarioConAsignacionActualizada: UsuarioConAsignaciones = {
//                 usuario: usuario,
//                 asignaciones: [{
//                     id: updated.id,
//                     area: area,
//                     rol: rol,
//                     created_at: updated.created_at,
//                     updated_at: updated.updated_at
//                 }]
//             };

//             return {
//                 status: 200,
//                 message: `Asignación actualizada correctamente para ${usuario.nombre} ${usuario.apellido}`,
//                 data: [usuarioConAsignacionActualizada]
//             };
//         } catch (error) {
//             console.error('Service error:', error);
//             return {
//                 status: 500,
//                 message: 'Error al actualizar la asignación',
//                 error: error.message
//             };
//         }
//     }

//     // Eliminar una asignación específica
//     async delete(id: number): Promise<UsuarioAreaResponse> {
//         try {
//             // Primero obtener la asignación para incluir los detalles en la respuesta
//             const { data: existingAssignment, error: getError } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .select(`
//                     id,
//                     usuario_id,
//                     area_id,
//                     rol_id,
//                     created_at,
//                     updated_at,
//                     usuarios:usuario_id (
//                         id,
//                         identificacion,
//                         nombre,
//                         apellido,
//                         correo,
//                         telefono,
//                         avatar,
//                         activo
//                     ),
//                     area:area_id (
//                         id,
//                         nombre,
//                         descripcion
//                     ),
//                     rol:rol_id (
//                         id,
//                         nombre,
//                         descripcion
//                     )
//                 `)
//                 .eq('id', id)
//                 .single();

//             if (getError || !existingAssignment) {
//                 return {
//                     status: 404,
//                     message: 'No se encontró la asignación especificada',
//                     data: []
//                 };
//             }

//             // Eliminar la asignación
//             const { error: deleteError } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .delete()
//                 .eq('id', id);

//             if (deleteError) {
//                 throw new InternalServerErrorException('Error al eliminar la asignación: ' + deleteError.message);
//             }

//             const usuario = Array.isArray(existingAssignment.usuarios) ? existingAssignment.usuarios[0] : existingAssignment.usuarios;
//             const area = Array.isArray(existingAssignment.area) ? existingAssignment.area[0] : existingAssignment.area;
//             const rol = Array.isArray(existingAssignment.rol) ? existingAssignment.rol[0] : existingAssignment.rol;

//             const usuarioConAsignacionEliminada: UsuarioConAsignaciones = {
//                 usuario: usuario,
//                 asignaciones: [{
//                     id: existingAssignment.id,
//                     area: area,
//                     rol: rol,
//                     created_at: existingAssignment.created_at,
//                     updated_at: existingAssignment.updated_at
//                 }]
//             };

//             return {
//                 status: 200,
//                 message: `Asignación eliminada correctamente para ${usuario.nombre} ${usuario.apellido}`,
//                 data: [usuarioConAsignacionEliminada]
//             };
//         } catch (error) {
//             console.error('Service error:', error);
//             return {
//                 status: 500,
//                 message: 'Error al eliminar la asignación',
//                 error: error.message
//             };
//         }
//     }

//     // Eliminar todas las asignaciones de un usuario
//     async deleteAllByUser(userId: number): Promise<UsuarioAreaResponse> {
//         try {
//             // Primero obtener todas las asignaciones del usuario
//             const { data: existingAssignments, error: getError } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .select(`
//                     id,
//                     usuario_id,
//                     area_id,
//                     rol_id,
//                     created_at,
//                     updated_at,
//                     usuarios:usuario_id (
//                         id,
//                         identificacion,
//                         nombre,
//                         apellido,
//                         correo,
//                         telefono,
//                         avatar,
//                         activo
//                     ),
//                     area:area_id (
//                         id,
//                         nombre,
//                         descripcion
//                     ),
//                     rol:rol_id (
//                         id,
//                         nombre,
//                         descripcion
//                     )
//                 `)
//                 .eq('usuario_id', userId);

//             if (getError || !existingAssignments || existingAssignments.length === 0) {
//                 return {
//                     status: 404,
//                     message: 'No se encontraron asignaciones para el usuario especificado',
//                     data: []
//                 };
//             }

//             // Eliminar todas las asignaciones del usuario
//             const { error: deleteError } = await this.supabaseService.clientAdmin
//                 .from('usuario_area')
//                 .delete()
//                 .eq('usuario_id', userId);

//             if (deleteError) {
//                 throw new InternalServerErrorException('Error al eliminar las asignaciones: ' + deleteError.message);
//             }

//             const usuario = Array.isArray(existingAssignments[0].usuarios)
//                 ? existingAssignments[0].usuarios[0]
//                 : existingAssignments[0].usuarios;

//             const asignaciones = existingAssignments.map(assignment => ({
//                 id: assignment.id,
//                 area: Array.isArray(assignment.area) ? assignment.area[0] : assignment.area,
//                 rol: Array.isArray(assignment.rol) ? assignment.rol[0] : assignment.rol,
//                 created_at: assignment.created_at,
//                 updated_at: assignment.updated_at
//             }));

//             const usuarioConAsignacionesEliminadas: UsuarioConAsignaciones = {
//                 usuario: usuario,
//                 asignaciones: asignaciones
//             };

//             return {
//                 status: 200,
//                 message: `Se eliminaron ${asignaciones.length} asignaciones para el usuario ${usuario.nombre} ${usuario.apellido}`,
//                 data: [usuarioConAsignacionesEliminadas]
//             };
//         } catch (error) {
//             console.error('Service error:', error);
//             return {
//                 status: 500,
//                 message: 'Error al eliminar las asignaciones del usuario',
//                 error: error.message
//             };
//         }
//     }
// }
