const fileManager = require('../utils/fileManager');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const notificationsController = require('./notificationsController');

const securityController = {
  // Registrar incidentes de seguridad
  async registerIncident(req, tipo, descripcion) {
    await fileManager.ensureTable('security_logs');
    const logs = await fileManager.readTable('security_logs');

    logs.push({
      id: Date.now().toString(),
      usuarioId: req.user ? req.user.id : null,
      ip: req.ip,
      tipo,
      descripcion,
      fecha: new Date().toISOString()
    });

    await fileManager.writeTable('security_logs', logs);

    // Enviar notificación si es crítico
    if (['UnauthorizedAccess', 'MultipleFailedLogin'].includes(tipo)) {
      await notificationsController.createNotification({
        body: {
          usuarioId: req.user ? req.user.id : null,
          mensaje: `Alerta de seguridad: ${descripcion}`,
          tipo: 'warning'
        }
      }, { status: () => ({ json: () => {} }) });
    }
  },

  // Bloquear un usuario por X tiempo
  async blockUser(req, res) {
    try {
      const { usuarioId, minutos } = req.body;
      if (!usuarioId || !minutos) {
        return res.status(400).json(errorResponse('usuarioId y minutos son obligatorios'));
      }

      await fileManager.ensureTable('user_blocks');
      const blocks = await fileManager.readTable('user_blocks');

      const expira = new Date(Date.now() + minutos * 60 * 1000).toISOString();
      blocks.push({ usuarioId, expira });
      await fileManager.writeTable('user_blocks', blocks);

      return res.json(successResponse({ usuarioId, expira }, 'Usuario bloqueado'));
    } catch (error) {
      console.error('Error bloqueando usuario:', error);
      return res.status(500).json(errorResponse('Error interno'));
    }
  },

  // Desbloquear un usuario
  async unblockUser(req, res) {
    try {
      const { usuarioId } = req.body;
      if (!usuarioId) {
        return res.status(400).json(errorResponse('usuarioId es obligatorio'));
      }

      await fileManager.ensureTable('user_blocks');
      let blocks = await fileManager.readTable('user_blocks');
      blocks = blocks.filter(b => b.usuarioId !== usuarioId);
      await fileManager.writeTable('user_blocks', blocks);

      return res.json(successResponse(null, 'Usuario desbloqueado'));
    } catch (error) {
      console.error('Error desbloqueando usuario:', error);
      return res.status(500).json(errorResponse('Error interno'));
    }
  },

  // Ver logs de seguridad (solo admin)
  async getSecurityLogs(req, res) {
    try {
      await fileManager.ensureTable('security_logs');
      const logs = await fileManager.readTable('security_logs');
      return res.json(successResponse(logs, `${logs.length} incidentes registrados`));
    } catch (error) {
      console.error('Error obteniendo logs:', error);
      return res.status(500).json(errorResponse('Error interno'));
    }
  }
};

module.exports = securityController;