import connection from './db.js';

const checkAndCreateRuletaTables = async () => {
  try {
    console.log('🔍 Verificando tablas de ruleta...');

    // Verificar si existe la tabla ruleta
    const [ruletaExists] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'ruleta'
    `);

    if (ruletaExists[0].count === 0) {
      console.log('📋 Creando tabla ruleta...');
      await connection.query(`
        CREATE TABLE ruleta (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          descripcion TEXT,
          tipo ENUM('comodin', 'puntos', 'personalizado') NOT NULL DEFAULT 'personalizado',
          comodin_id INT NULL,
          texto_personalizado TEXT NULL,
          imagen_url VARCHAR(500) NULL,
          probabilidad DECIMAL(5,2) NOT NULL DEFAULT 1.00,
          activo BOOLEAN NOT NULL DEFAULT TRUE,
          orden INT NOT NULL DEFAULT 0,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (comodin_id) REFERENCES comodines(idcomodines) ON DELETE SET NULL
        )
      `);
      console.log('✅ Tabla ruleta creada');
    } else {
      console.log('✅ Tabla ruleta ya existe');
    }

    // Verificar si existe la tabla configuracion_ruleta
    const [configExists] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'configuracion_ruleta'
    `);

    if (configExists[0].count === 0) {
      console.log('📋 Creando tabla configuracion_ruleta...');
      await connection.query(`
        CREATE TABLE configuracion_ruleta (
          id INT PRIMARY KEY DEFAULT 1,
          ruleta_activa BOOLEAN NOT NULL DEFAULT FALSE,
          max_giros_por_dia INT NOT NULL DEFAULT 3,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla configuracion_ruleta creada');
    } else {
      console.log('✅ Tabla configuracion_ruleta ya existe');
    }

    // Insertar configuración por defecto
    await connection.query(`
      INSERT INTO configuracion_ruleta (id, ruleta_activa, max_giros_por_dia) 
      VALUES (1, TRUE, 3)
      ON DUPLICATE KEY UPDATE 
        ruleta_activa = VALUES(ruleta_activa),
        max_giros_por_dia = VALUES(max_giros_por_dia)
    `);
    console.log('✅ Configuración por defecto insertada');

    // Verificar si hay comodines disponibles
    const [comodinesCount] = await connection.query('SELECT COUNT(*) as count FROM comodines');
    console.log(`📊 Comodines disponibles: ${comodinesCount[0].count}`);

    // Insertar elementos de ejemplo si no hay ninguno
    const [ruletaCount] = await connection.query('SELECT COUNT(*) as count FROM ruleta');
    if (ruletaCount[0].count === 0) {
      console.log('🎰 Insertando elementos de ejemplo...');
      
      const elementos = [
        {
          nombre: '+10 Puntos',
          descripcion: 'Gana 10 puntos para la tabla general',
          tipo: 'puntos',
          comodin_id: null,
          texto_personalizado: '+10',
          probabilidad: 25.0,
          activo: true,
          orden: 1
        },
        {
          nombre: '+5 Puntos',
          descripcion: 'Gana 5 puntos para la tabla general',
          tipo: 'puntos',
          comodin_id: null,
          texto_personalizado: '+5',
          probabilidad: 30.0,
          activo: true,
          orden: 2
        },
        {
          nombre: '-5 Puntos',
          descripcion: 'Pierde 5 puntos de la tabla general',
          tipo: 'puntos',
          comodin_id: null,
          texto_personalizado: '-5',
          probabilidad: 10.0,
          activo: true,
          orden: 3
        },
        {
          nombre: '¡Mejor Suerte!',
          descripcion: 'No ganas nada esta vez, pero no te rindas',
          tipo: 'personalizado',
          comodin_id: null,
          texto_personalizado: '¡Mejor suerte la próxima vez!',
          probabilidad: 20.0,
          activo: true,
          orden: 4
        }
      ];

      // Solo agregar comodín si hay comodines disponibles
      if (comodinesCount[0].count > 0) {
        elementos.unshift({
          nombre: 'Comodín Especial',
          descripcion: 'Un comodín especial para usar en partidas',
          tipo: 'comodin',
          comodin_id: 1,
          texto_personalizado: null,
          probabilidad: 15.0,
          activo: true,
          orden: 1
        });
        // Ajustar orden de los demás elementos
        elementos[1].orden = 2;
        elementos[2].orden = 3;
        elementos[3].orden = 4;
        elementos[4].orden = 5;
      }

      for (const elemento of elementos) {
        await connection.query(`
          INSERT INTO ruleta (nombre, descripcion, tipo, comodin_id, texto_personalizado, probabilidad, activo, orden)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          elemento.nombre,
          elemento.descripcion,
          elemento.tipo,
          elemento.comodin_id,
          elemento.texto_personalizado,
          elemento.probabilidad,
          elemento.activo,
          elemento.orden
        ]);
      }
      console.log('✅ Elementos de ejemplo insertados');
    } else {
      console.log('✅ Ya hay elementos en la ruleta');
    }

    // Mostrar resumen
    const [finalCount] = await connection.query('SELECT COUNT(*) as count FROM ruleta');
    console.log(`📋 Total de elementos en ruleta: ${finalCount[0].count}`);

    console.log('🎉 Verificación completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    process.exit(0);
  }
};

checkAndCreateRuletaTables(); 