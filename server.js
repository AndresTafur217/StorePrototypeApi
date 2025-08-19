require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware global
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // puertos comunes de React
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Importar rutas con manejo de errores
let routesLoaded = [];
let routesFailed = [];

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const specificationRoutes = require('./routes/specificationRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const areaRoutes = require('./routes/areaRoutes');
const typeRoutes = require('./routes/typeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/specifications', specificationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/types', typeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/ratings', ratingRoutes);

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    routes: {
      loaded: routesLoaded,
      failed: routesFailed,
      total: routesLoaded.length + routesFailed.length
    }
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      '/health',
      '/api/users',
      '/api/products', 
      '/api/specifications',
      '/api/favorites',
      '/api/areas',
      '/api/types',
      '/api/reports',
      '/api/orders',
      '/api/invoices',
      '/api/ratings'
    ]
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log('\n🚀 Servidor iniciado correctamente');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`✅ Rutas cargadas: ${routesLoaded.length}`);
  if (routesFailed.length > 0) {
    console.log(`❌ Rutas fallidas: ${routesFailed.join(', ')}`);
  }
  console.log('─'.repeat(50));
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso`);
  } else {
    console.error('❌ Error iniciando servidor:', err);
  }
  process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;