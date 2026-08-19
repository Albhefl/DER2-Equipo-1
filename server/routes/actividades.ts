import { Router, type Response } from 'express';
import db from '../src/db.js';
import { verificarToken, verificarRol, type AuthRequest } from '../middleware/auth.js';
import multer, { type FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { enviarCorreoInvitacion } from '../src/mailer.js';


const router = Router();

type AuthRequestConArchivo = AuthRequest & { file?: Express.Multer.File };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const nombreUnico = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, nombreUnico);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const permitidos = /\.(pdf|docx?|png|jpe?g|zip)$/i;
    if (!permitidos.test(file.originalname)) {
      return cb(new Error('Formato de archivo no permitido.'));
    }
    cb(null, true);
  }
});

const INCLUDE_RELATIONS = {
  assignees: { include: { user: { select: { id: true, name: true } } } },
  project: { select: { id: true, name: true } },
  evidence: true,
};

// ⚠️ Estas dos funciones son SOLO para Activity.status (enum PENDING/IN_PROCESS/
// IN_REVIEW/DONE). NO deben usarse para Project.status — ese campo ahora es
// String libre ('Activo' | 'En proceso' | 'En revisión' | 'Completado' | 'Pausado')
// y pasar sus valores por este mapeo los reescribía silenciosamente a 'PENDING'
// (por no matchear el case-sensitive 'En proceso' vs 'En Proceso'), guardando
// literalmente el texto "PENDING" en la base y mostrando siempre "Activo" al
// devolverlo. Ver normalizarEstadoProyecto() más abajo para el reemplazo correcto.
function mapStatusToClient(status: string): string {
  switch (status) {
    case 'IN_PROCESS': return 'En Proceso';
    case 'IN_REVIEW': return 'En Revisión';
    case 'DONE': return 'Completado';
    case 'PENDING':
    default: return 'Activo';
  }
}

function mapStatusToPrisma(status: string): 'PENDING' | 'IN_PROCESS' | 'IN_REVIEW' | 'DONE' {
  switch (status?.trim()) {
    case 'En proceso':
    case 'En Proceso':
    case 'IN_PROCESS': return 'IN_PROCESS';
    case 'En revisión':
    case 'En Revisión':
    case 'IN_REVIEW': return 'IN_REVIEW';
    case 'Completado':
    case 'DONE': return 'DONE';
    case 'Activo':
    case 'PENDING':
    default: return 'PENDING';
  }
}

/**
 * GET /api/actividades/proyectos
 */
router.get('/proyectos', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const usuario_id = req.user?.userId;
  const rol = req.user?.role;

  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const whereCondition = rol === 'EVALUATOR'
      ? { evaluators: { some: { userId: usuario_id } } }
      : { members: { some: { userId: usuario_id } } };

    const proyectos = await db.project.findMany({
      where: whereCondition,
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        evaluators: { include: { user: { select: { id: true, name: true, email: true } } } },
        activities: { select: { id: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const proyectosMapeados = proyectos.map((p: any) => {
      const totalActivities = p.activities.length;
      const doneActivities = p.activities.filter((a: any) => a.status === 'DONE').length;
      const progress = totalActivities > 0 ? Math.round((doneActivities / totalActivities) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        startDate: p.startDate,
        endDate: p.endDate,
        status: mapStatusToClient(p.status),
        progress,
        members: p.members.map((m: any) => m.user),
        evaluators: p.evaluators.map((e: any) => e.user)
      };
    });

    return res.status(200).json({ proyectos: proyectosMapeados });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * POST /api/actividades/proyectos
 */
router.post('/proyectos', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const usuario_id = req.user?.userId;
  const { id, name, description, startDate, endDate, status, evaluators, members } = req.body;

  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'El nombre del proyecto es obligatorio.' });
  }

  try {
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    const parsedEndDate = endDate ? new Date(endDate) : null;
    const estadoProyecto = mapStatusToPrisma(status);

    const membersList: Array<{ id: string }> = Array.isArray(members) ? members : [];
    const evaluatorsList: Array<{ id: string }> = Array.isArray(evaluators) ? evaluators : [];

    if (!membersList.some(m => m.id === usuario_id)) {
      membersList.push({ id: usuario_id });
    }

    let proyectoResult: any;

    if (id) {
      await db.projectMember.deleteMany({ where: { projectId: id } });
      await db.projectEvaluator.deleteMany({ where: { projectId: id } });

      proyectoResult = await db.project.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          status: estadoProyecto,
          members: {
            create: membersList.map(m => ({ userId: m.id }))
          },
          evaluators: {
            create: evaluatorsList.map(e => ({ userId: e.id }))
          }
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          evaluators: { include: { user: { select: { id: true, name: true, email: true } } } },
          activities: { select: { id: true, status: true } }
        }
      });
    } else {
      proyectoResult = await db.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          status: estadoProyecto,
          members: {
            create: membersList.map(m => ({ userId: m.id }))
          },
          evaluators: {
            create: evaluatorsList.map(e => ({ userId: e.id }))
          }
        },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          evaluators: { include: { user: { select: { id: true, name: true, email: true } } } },
          activities: { select: { id: true, status: true } }
        }
      });
    }

    const totalActivities = proyectoResult.activities?.length || 0;
    const doneActivities = proyectoResult.activities?.filter((a: any) => a.status === 'DONE').length || 0;
    const progress = totalActivities > 0 ? Math.round((doneActivities / totalActivities) * 100) : 0;

    // 📧 NUEVO: Disparar correos de invitación a los miembros y evaluadores
    proyectoResult.members.forEach((m: any) => {
      if (m.user?.email && m.user.id !== usuario_id) {
        enviarCorreoInvitacion(m.user.email, proyectoResult.name, 'estudiante');
      }
    });

    proyectoResult.evaluators.forEach((e: any) => {
      if (e.user?.email) {
        enviarCorreoInvitacion(e.user.email, proyectoResult.name, 'evaluador');
      }
    });

    return res.status(id ? 200 : 201).json({
      message: id ? 'Proyecto actualizado exitosamente.' : 'Proyecto creado exitosamente.',
      proyecto: {
        id: proyectoResult.id,
        name: proyectoResult.name,
        description: proyectoResult.description,
        startDate: proyectoResult.startDate,
        endDate: proyectoResult.endDate,
        // 🔧 FIX: antes era mapStatusToClient(proyectoResult.status), que
        // volvía a traducir el string libre y regresaba siempre 'Activo'.
        status: proyectoResult.status,
        // ✅ NUEVO: antes la respuesta tampoco incluía la prioridad, así que
        // aunque se hubiera guardado, el frontend nunca la recibía de vuelta.
        priority: proyectoResult.priority || 'Alta',
        progress,
        members: proyectoResult.members.map((m: any) => m.user),
        evaluators: proyectoResult.evaluators.map((e: any) => e.user)
      }
    });

  } catch (error) {
    console.error('Error al guardar proyecto:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * DELETE /api/actividades/proyectos/:id
 * Ruta de borrado agregada para solucionar el error 404 / cannot DELETE
 */
router.delete('/proyectos/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de proyecto requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const proyectoExistente = await db.project.findFirst({
      where: { id: id as string },
    });

    if (!proyectoExistente) return res.status(404).json({ message: 'Proyecto no encontrado.' });

    // Limpiamos relaciones previas
    await db.projectMember.deleteMany({ where: { projectId: id as string } });
    await db.projectEvaluator.deleteMany({ where: { projectId: id as string } });

    // Desvinculamos actividades asociadas para evitar conflictos de llave foránea
    await db.activity.updateMany({
      where: { projectId: id as string },
      data: { projectId: null }
    });

    // Eliminamos el proyecto
    await db.project.delete({ where: { id: id as string } });

    return res.status(200).json({ message: 'Proyecto eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * GET /api/actividades
 */
router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const usuario_id = req.user?.userId;
  const rol = req.user?.role;

  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const where = rol === 'EVALUATOR'
      ? { project: { evaluators: { some: { userId: usuario_id } } } }
      : {
          OR: [
            { project: { members: { some: { userId: usuario_id } } } },
            { assignees: { some: { userId: usuario_id } } }
          ]
        };

    const actividades = await db.activity.findMany({
      where,
      include: INCLUDE_RELATIONS,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ actividades });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * POST /api/actividades
 */
router.post('/', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { nombre, descripcion, fecha_limite, prioridad, estado, projectId, responsableId } = req.body;
  const usuario_id = req.user?.userId;

  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre es obligatorio.' });
    }

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha_limite);
    fechaSeleccionada.setUTCHours(0, 0, 0, 0);

    if (!fecha_limite || fechaSeleccionada < hoy) {
      return res.status(400).json({ message: 'La fecha límite no puede ser anterior a hoy.' });
    }

    const prioridadUpper = prioridad ? String(prioridad).toUpperCase() : 'MED';
    const estadoUpper = estado ? mapStatusToPrisma(estado) : 'PENDING';
    const usuarioAsignado = responsableId || usuario_id;

    const actividad = await db.activity.create({
      data: {
        name: nombre.trim(),
        description: descripcion?.trim() || null,
        deadline: fechaSeleccionada,
        priority: prioridadUpper as any,
        status: estadoUpper,
        projectId: projectId || null,
        assignees: {
          create: [{ userId: usuarioAsignado }],
        },
      },
      include: INCLUDE_RELATIONS,
    });

    return res.status(201).json({ message: 'Actividad creada exitosamente.', actividad });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

/**
 * GET /api/actividades/:id
 */
router.get('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const actividad = await db.activity.findFirst({
      where: { id: id as string },
      include: INCLUDE_RELATIONS,
    });

    if (!actividad) return res.status(404).json({ message: 'Actividad no encontrada.' });

    return res.status(200).json({ actividad });
  } catch (error) {
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.post('/:id/responsables', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const { userId } = req.body;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });
  if (!userId) return res.status(400).json({ message: 'Debes seleccionar un compañero para asignar.' });

  try {
    const actividad = await db.activity.findFirst({
      where: { id: id as string, assignees: { some: { userId: usuario_id } } },
    });

    if (!actividad) return res.status(404).json({ message: 'Actividad no encontrada.' });

    const usuarioAAsignar = await db.user.findUnique({ where: { id: userId } });
    if (!usuarioAAsignar) return res.status(404).json({ message: 'El usuario a asignar no existe.' });

    const yaAsignado = await db.activityAssignee.findUnique({
      where: { activityId_userId: { activityId: id as string, userId } },
    });

    if (!yaAsignado) {
      await db.activityAssignee.create({ data: { activityId: id as string, userId } });
    }

    const actividadActualizada = await db.activity.findUnique({
      where: { id: id as string },
      include: INCLUDE_RELATIONS,
    });

    return res.status(200).json({ message: 'Responsable asignado exitosamente.', actividad: actividadActualizada });
  } catch (error) {
    console.error('Error al asignar responsable:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.put('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const { nombre, descripcion, fecha_limite, estado, prioridad, projectId, responsableId } = req.body;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const actividadExistente = await db.activity.findFirst({
      where: { id: id as string },
    });

    if (!actividadExistente) return res.status(404).json({ message: 'Actividad no encontrada.' });
    if (!nombre || nombre.trim() === '') return res.status(400).json({ message: 'El nombre es obligatorio.' });

    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha_limite);
    fechaSeleccionada.setUTCHours(0, 0, 0, 0);

    if (!fecha_limite || fechaSeleccionada < hoy) {
      return res.status(400).json({ message: 'La fecha límite no puede ser anterior a hoy.' });
    }

    const estadoUpper = estado ? mapStatusToPrisma(estado) : actividadExistente.status;
    const prioridadUpper = prioridad ? String(prioridad).toUpperCase() : actividadExistente.priority;

    if (responsableId) {
      await db.activityAssignee.deleteMany({ where: { activityId: id as string } });
      await db.activityAssignee.create({ data: { activityId: id as string, userId: responsableId } });
    }

    const actividadActualizada = await db.activity.update({
      where: { id: id as string },
      data: {
        name: nombre.trim(),
        description: descripcion?.trim() || null,
        deadline: fechaSeleccionada,
        status: estadoUpper as any,
        priority: prioridadUpper as any,
        projectId: projectId !== undefined ? (projectId || null) : actividadExistente.projectId,
      },
      include: INCLUDE_RELATIONS,
    });

    return res.status(200).json({ message: 'Actividad actualizada exitosamente.', actividad: actividadActualizada });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.delete('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const actividadExistente = await db.activity.findFirst({
      where: { id: id as string },
    });

    if (!actividadExistente) return res.status(404).json({ message: 'Actividad no encontrada.' });

    await db.activity.delete({ where: { id: id as string } });
    return res.status(200).json({ message: 'Actividad eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.get('/:id/comentarios', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const comentarios = await db.comment.findMany({
      where: { activityId: id as string },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ comentarios });
  } catch (error) {
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.post('/:id/comentarios', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const { contenido } = req.body;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });
  if (!contenido || String(contenido).trim() === '') return res.status(400).json({ message: 'El comentario no puede estar vacío.' });

  try {
    const comentario = await db.comment.create({
      data: {
        content: String(contenido).trim(),
        activityId: id as string,
        authorId: usuario_id,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    return res.status(201).json({ message: 'Comentario publicado exitosamente.', comentario });
  } catch (error) {
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.get('/:id/evidencias', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const evidencias = await db.evidence.findMany({
      where: { activityId: id as string },
      include: { creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ evidencias });
  } catch (error) {
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.post('/:id/evidencias', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const { url } = req.body;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });
  if (!url || String(url).trim() === '') return res.status(400).json({ message: 'La URL de la evidencia es obligatoria.' });

  try {
    const evidencia = await db.evidence.create({
      data: {
        url: String(url).trim(),
        activityId: id as string,
        createdBy: usuario_id,
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    return res.status(201).json({ message: 'Evidencia registrada exitosamente.', evidencia });
  } catch (error) {
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.post(
  '/:id/evidencias/upload',
  verificarToken,
  upload.single('file'),
  async (req: any, res: Response): Promise<any> => {
    const { id } = req.params;
    const usuario_id = req.user?.userId;

    if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
    if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo.' });

    try {
      const evidencia = await db.evidence.create({
        data: {
          url: req.file.filename,
          activityId: id as string,
          createdBy: usuario_id,
        },
        include: { creator: { select: { id: true, name: true } } },
      });

      return res.status(201).json({ message: 'Evidencia subida exitosamente.', evidencia });
    } catch (error) {
      console.error('Error al subir evidencia:', error);
      return res.status(500).json({ message: 'Error interno en el servidor.' });
    }
  }
);

router.delete('/comentarios/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de comentario requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const comentarioExistente = await db.comment.findUnique({
      where: { id: id as string }
    });

    if (!comentarioExistente) {
      return res.status(404).json({ message: 'Comentario no encontrado.' });
    }

    if (comentarioExistente.authorId !== usuario_id) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este comentario.' });
    }

    await db.comment.delete({
      where: { id: id as string }
    });

    return res.status(200).json({ message: 'Comentario eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar el comentario:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.delete('/evidencias/:evidenciaId', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { evidenciaId } = req.params;
  const usuario_id = req.user?.userId;

  if (!evidenciaId) return res.status(400).json({ message: 'ID de evidencia requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const evidencia = await db.evidence.findUnique({ where: { id: evidenciaId } });
    if (!evidencia) return res.status(404).json({ message: 'Evidencia no encontrada.' });

    if (!evidencia.url.startsWith('http')) {
      const filePath = path.join(uploadsDir, evidencia.url);
      fs.unlink(filePath, (err) => {
        if (err) console.warn('No se pudo borrar el archivo físico:', err.message);
      });
    }

    await db.evidence.delete({ where: { id: evidenciaId } });
    return res.status(200).json({ message: 'Evidencia eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar evidencia:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.get('/:id/evaluacion', verificarToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  try {
    const evaluacion = await db.evaluation.findUnique({
      where: { activityId: id as string },
      include: { evaluator: { select: { id: true, name: true } } },
    });

    return res.status(200).json({ evaluacion: evaluacion || null });
  } catch (error) {
    console.error('Error al obtener evaluación:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

router.post('/:id/evaluar', verificarToken, verificarRol('EVALUATOR'), async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const { score, criterios, comentario, status } = req.body;
  const usuario_id = req.user?.userId;

  if (!id) return res.status(400).json({ message: 'ID de actividad requerido.' });
  if (!usuario_id) return res.status(401).json({ message: 'Usuario no autenticado.' });

  const numScore = Number(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 100) {
    return res.status(400).json({ message: 'El score debe ser un número entre 0 y 100.' });
  }

  try {
    const actividadExistente = await db.activity.findUnique({
      where: { id: id as string }
    });

    if (!actividadExistente) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    const actividadActualizada = await db.activity.update({
      where: { id: id as string },
      data: {
        status: status ? mapStatusToPrisma(status) : 'DONE',
      },
      include: INCLUDE_RELATIONS,
    });

    const evaluacion = await db.evaluation.upsert({
      where: { activityId: id as string },
      update: {
        score: Number(score),
        criteria: criterios,
        comentario: comentario || null,
        evaluatorId: usuario_id,
      },
      create: {
        activityId: id as string,
        score: Number(score),
        criteria: criterios,
        comentario: comentario || null,
        evaluatorId: usuario_id,
      },
    });

    return res.status(200).json({
      message: 'Evaluación guardada exitosamente.',
      actividad: actividadActualizada,
      evaluacion
    });

  } catch (error) {
    console.error('Error al guardar evaluación:', error);
    return res.status(500).json({ message: 'Error interno en el servidor.' });
  }
});

export default router;
