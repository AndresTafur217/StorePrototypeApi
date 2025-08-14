require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(cors());
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

try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/users', userRoutes);
  routesLoaded.push('userRoutes');
} catch (error) {
  console.error('Error cargando userRoutes:', error.message);
  routesFailed.push('userRoutes');
}

try {
  const productRoutes = require('./routes/productRoutes');
  app.use('/api/product', productRoutes);
  routesLoaded.push('productRoutes');
} catch (error) {
  console.error('Error cargando productRoutes:', error.message);
  routesFailed.push('productRoutes');
}

try {
  const specificationRoutes = require('./routes/specificationRoutes');
  app.use('/api/specification', specificationRoutes);
  routesLoaded.push('specificationRoutes');
} catch (error) {
  console.error('Error cargando specificationRoutes:', error.message);
  routesFailed.push('specificationRoutes');
}

try {
  const favoriteRoutes = require('./routes/favoriteRoutes');
  app.use('/api/favorite', favoriteRoutes);
  routesLoaded.push('favoriteRoutes');
} catch (error) {
  console.error('Error cargando favoriteRoutes:', error.message);
  routesFailed.push('favoriteRoutes');
}

try {
  const areaRoutes = require('./routes/areaRoutes');
  app.use('/api/area', areaRoutes);
  routesLoaded.push('areaRoutes');
} catch (error) {
  console.error('Error cargando areaRoutes:', error.message);
  routesFailed.push('areaRoutes');
}

try {
  const typeRoutes = require('./routes/typeRoutes');
  app.use('/api/type', typeRoutes);
  routesLoaded.push('typeRoutes');
} catch (error) {
  console.error('Error cargando typeRoutes:', error.message);
  routesFailed.push('typeRoutes');
}

try {
  const reportRoutes = require('./routes/reportRoutes');
  app.use('/api/report', reportRoutes);
  routesLoaded.push('reportRoutes');
} catch (error) {
  console.error('Error cargando reportRoutes:', error.message);
  routesFailed.push('reportRoutes');
}

try {
  const orderRoutes = require('./routes/orderRoutes');
  app.use('/api/order', orderRoutes);
  routesLoaded.push('orderRoutes');
} catch (error) {
  console.error('Error cargando orderRoutes:', error.message);
  routesFailed.push('orderRoutes');
}

try {
  const invoiceRoutes = require('./routes/invoiceRoutes');
  app.use('/api/invoice', invoiceRoutes);
  routesLoaded.push('invoiceRoutes');
} catch (error) {
  console.error('Error cargando invoiceRoutes:', error.message);
  routesFailed.push('invoiceRoutes');
}

try {
  const ratingRoutes = require('./routes/ratingRoutes');
  app.use('/api/rating', ratingRoutes);
  routesLoaded.push('ratingRoutes');
} catch (error) {
  console.error('Error cargando ratingRoutes:', error.message);
  routesFailed.push('ratingRoutes');
}

try {
  const paymentRoutes = require('./routes/paymentRoutes');
  app.use('/api/payment', paymentRoutes);
  routesLoaded.push('paymentRoutes');
} catch (error) {
  console.error('Error cargando paymentRoutes:', error.message);
  routesFailed.push('paymentRoutes');
}

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
      '/api/product', 
      '/api/specification',
      '/api/favorite',
      '/api/area',
      '/api/type',
      '/api/report',
      '/api/order',
      '/api/invoice',
      '/api/rating',
      '/api/payment'
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