import connection from './db.js';

const testConnection = async () => {
  try {
    console.log('🔍 Probando conexión...');

    // Probar conexión básica
    const [result] = await connection.query('SELECT 1 as test');
    console.log('✅ Conexión exitosa:', result[0]);

    // Verificar estructura de tabla edicion
    const [edicionStructure] = await connection.query(`
      DESCRIBE edicion
    `);
    
    console.log('📋 Estructura de tabla edicion:');
    edicionStructure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    // Verificar todas las ediciones
    const [ediciones] = await connection.query(`
      SELECT * FROM edicion ORDER BY idEdicion DESC LIMIT 5
    `);
    
    console.log('📋 Ediciones disponibles:', ediciones.length);
    ediciones.forEach(ed => {
      console.log(`  - ID: ${ed.idEdicion}, Inicio: ${ed.fecha_inicio}, Fin: ${ed.fecha_fin}`);
    });

    // Verificar tabla general
    const [tablaGeneral] = await connection.query(`
      SELECT COUNT(*) as total FROM tabla_general
    `);
    
    console.log('📊 Total registros en tabla_general:', tablaGeneral[0].total);

    // Probar consulta completa con la primera edición
    if (ediciones.length > 0) {
      const idEdicion = ediciones[0].idEdicion;
      
      const [datos] = await connection.query(`
        SELECT 
          tg.jugador_nickname,
          tg.puntos_totales,
          tg.partidas_jugadas,
          tg.partidas_ganadas,
          u.foto,
          u.descripcion
        FROM tabla_general tg
        LEFT JOIN usuarios u ON tg.jugador_nickname = u.nickname
        WHERE tg.idEdicion = ?
        ORDER BY tg.puntos_totales DESC
      `, [idEdicion]);
      
      console.log('📈 Datos de tabla general para edición', idEdicion, ':', datos.length);
      datos.forEach((jugador, index) => {
        console.log(`  ${index + 1}. ${jugador.jugador_nickname} - ${jugador.puntos_totales} pts`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
};

testConnection(); 