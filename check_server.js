import axios from 'axios';

const checkServer = async () => {
  try {
    console.log('🔍 Verificando servidor...');
    const response = await axios.get('http://localhost:3000/api/test');
    console.log('✅ Servidor activo:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Servidor no disponible:', error.message);
    return false;
  }
};

checkServer(); 