// Endpoint de prueba para verificar que ForestAdmin puede conectarse
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002; // Puerto diferente para prueba

// CORS permisivo para pruebas
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Endpoint de prueba simple
app.get('/forest', (req, res) => {
  console.log('📞 Solicitud recibida en /forest');
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  
  res.json({
    status: 'ok',
    message: 'ForestAdmin test endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🧪 Servidor de prueba corriendo en puerto ${port}`);
  console.log(`📡 Test endpoint: http://localhost:${port}/forest`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
});
