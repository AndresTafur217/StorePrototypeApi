require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global
app.use(cors());
app.use(bodyParser.json());

// Middleware de logging básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Importar rutas
const crudRoutes = require('./routes/crudRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes= require('./routes/productRoutes');
const specificationRoutes = require('./routes/specificationRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

// Usar rutas
app.use('/api', crudRoutes);
app.use('/api/users', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/specification', specificationRoutes);
app.use('/api/favorite', favoriteRoutes);

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Datos guardados en: ${path.join(__dirname, 'data')}`);
  console.log(`API disponible en: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;