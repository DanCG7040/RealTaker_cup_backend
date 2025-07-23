import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

const testRoutes = async () => {
  console.log('🧪 Probando rutas de usuarios...\n');

  try {
    // Probar ruta de test general
    console.log('1. Probando ruta de test...');
    const testResponse = await axios.get(`${API_BASE}/test`);
    console.log('✅ Servidor activo:', testResponse.data.message);
    console.log('📋 Rutas disponibles:', testResponse.data.rutas_disponibles);
    console.log('');

    // Probar ruta de usuarios/logros (debería dar 403 sin token)
    console.log('2. Probando ruta /usuarios/logros sin token...');
    try {
      await axios.get(`${API_BASE}/usuarios/logros`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correcto: Ruta protegida, requiere token');
      } else {
        console.log('❌ Error inesperado:', error.response?.status, error.response?.data);
      }
    }
    console.log('');

    // Probar ruta de configuración de ruleta
    console.log('3. Probando ruta /ruleta/configuracion...');
    try {
      const configResponse = await axios.get(`${API_BASE}/ruleta/configuracion`);
      console.log('✅ Configuración de ruleta:', configResponse.data);
    } catch (error) {
      console.log('❌ Error en configuración de ruleta:', error.response?.status, error.response?.data);
    }
    console.log('');

    console.log('🎉 Pruebas completadas');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
};

testRoutes(); 