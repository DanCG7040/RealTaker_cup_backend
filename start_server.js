import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando servidor backend...');

// Crear carpeta uploads si no existe
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Carpeta uploads creada');
}

// Iniciar el servidor
const server = spawn('node', ['index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
});

server.on('close', (code) => {
  console.log(`🛑 Servidor cerrado con código: ${code}`);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('🛑 Deteniendo servidor...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Deteniendo servidor...');
  server.kill('SIGTERM');
}); 