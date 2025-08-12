const fs = require('fs').promises;
const path = require('path');
const fileManager = require ('./utils/fileManager');

const users = await fileManager.readTable('users');

const auth = {
    
    async findUser(email) {
        const user = users.find(u => 
            u.emal.toLowerCase() === email.toLowerCase()
        );

        if (!user) {
            return res.status(401).json(
                errorResponse('Credenciales incorrectas')
            );
        }
    },

    async verifyPassword(contraseña, user) {
        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(contraseña, user.contraseña);
        
        if (!passwordMatch) {
        return res.status(401).json(
            errorResponse('Contraseña incorrecta')
        );
        }
    },

    async verifyState(user) {
        // Verificar estado activo
        if (user.estado !== 'activo') {
        return res.status(403).json(
            errorResponse('Usuario inactivo. Contacta al administrador')
        );
        }
    }
}

module.exports = auth;