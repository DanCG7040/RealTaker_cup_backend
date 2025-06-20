import db from './db.js';

const createPuntosTable = async () => {
  try {
    console.log('🔧 Creando tabla puntos_por_tipo_partida...');
    
    // Crear la tabla
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS puntos_por_tipo_partida (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo ENUM('PVP', 'TodosContraTodos') NOT NULL,
        posicion INT NOT NULL,
        puntos INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_tipo_posicion (tipo, posicion)
      )
    `;
    
    await db.execute(createTableQuery);
    console.log('✅ Tabla creada exitosamente');
    
    // Insertar datos de ejemplo para PVP
    console.log('📝 Insertando datos de ejemplo para PVP...');
    const pvpData = [
      ['PVP', 1, 10],
      ['PVP', 2, 5]
    ];
    
    for (const [tipo, posicion, puntos] of pvpData) {
      await db.execute(
        'INSERT IGNORE INTO puntos_por_tipo_partida (tipo, posicion, puntos) VALUES (?, ?, ?)',
        [tipo, posicion, puntos]
      );
    }
    
    // Insertar datos de ejemplo para TodosContraTodos
    console.log('📝 Insertando datos de ejemplo para TodosContraTodos...');
    const tctData = [
      ['TodosContraTodos', 1, 10],
      ['TodosContraTodos', 2, 8],
      ['TodosContraTodos', 3, 6],
      ['TodosContraTodos', 4, 4],
      ['TodosContraTodos', 5, 2]
    ];
    
    for (const [tipo, posicion, puntos] of tctData) {
      await db.execute(
        'INSERT IGNORE INTO puntos_por_tipo_partida (tipo, posicion, puntos) VALUES (?, ?, ?)',
        [tipo, posicion, puntos]
      );
    }
    
    console.log('✅ Datos de ejemplo insertados exitosamente');
    
    // Verificar los datos
    console.log('🔍 Verificando datos insertados...');
    const [rows] = await db.execute('SELECT * FROM puntos_por_tipo_partida ORDER BY tipo, posicion');
    console.log('📊 Datos en la tabla:');
    rows.forEach(row => {
      console.log(`   ${row.tipo} - Posición ${row.posicion}: ${row.puntos} puntos`);
    });
    
    console.log('✅ Configuración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  } finally {
    process.exit(0);
  }
};

createPuntosTable(); 