const fileManager = require('../utils/fileManager');
const { generateId } = require('../utils/idGenerator');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const notificationsController = {
  // Crear notificación
  async createNotification(req, res) {
    try {
      await fileManager.ensureTable('notifications');

      const { usuarioId, mensaje, tipo } = req.body;

      if (!usuarioId || !mensaje) {
        return res.status(400).json(
          errorResponse('usuarioId y mensaje son obligatorios')
        );
      }

      const newNotification = {
        id: generateId(),
        usuarioId,
        mensaje,
        tipo: tipo || 'general', // info, warning, success, error
        leida: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const notifications = await fileManager.readTable('notifications');
      notifications.push(newNotification);
      await fileManager.writeTable('notifications', notifications);

      res.status(201).json(
        successResponse(newNotification, 'Notificación creada exitosamente')
      );

    } catch (error) {
      console.error('Error creando notificación:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  // Listar notificaciones del usuario autenticado
  async getMyNotifications(req, res) {
    try {
      await fileManager.ensureTable('notifications');

      const usuarioId = req.user.id;
      const notifications = await fileManager.readTable('notifications');

      const userNotifications = notifications.filter(n => n.usuarioId === usuarioId);

      res.json(
        successResponse(userNotifications, `${userNotifications.length} notificaciones encontradas`)
      );
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  // Marcar como leída
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.user.id;

      const notifications = await fileManager.readTable('notifications');
      const notifIndex = notifications.findIndex(n => n.id === id && n.usuarioId === usuarioId);

      if (notifIndex === -1) {
        return res.status(404).json(errorResponse('Notificación no encontrada'));
      }

      notifications[notifIndex].leida = true;
      notifications[notifIndex].updatedAt = new Date().toISOString();

      await fileManager.writeTable('notifications', notifications);

      res.json(
        successResponse(notifications[notifIndex], 'Notificación marcada como leída')
      );

    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  },

  // Eliminar notificación
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.user.id;

      let notifications = await fileManager.readTable('notifications');
      const exists = notifications.find(n => n.id === id && n.usuarioId === usuarioId);

      if (!exists) {
        return res.status(404).json(errorResponse('Notificación no encontrada'));
      }

      notifications = notifications.filter(n => n.id !== id);
      await fileManager.writeTable('notifications', notifications);

      res.json(successResponse(null, 'Notificación eliminada'));

    } catch (error) {
      console.error('Error eliminando notificación:', error);
      res.status(500).json(errorResponse('Error interno del servidor'));
    }
  }
};

module.exports = notificationsController;