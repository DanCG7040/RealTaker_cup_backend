import connection from '../db.js';

// Script para insertar elementos de prueba en la ruleta
const insertRuletaItems = async () => {
  try {
    console.log('🔄 Insertando elementos de prueba en la ruleta...');

    // Verificar si ya existen elementos
    const [existingItems] = await connection.query('SELECT COUNT(*) as count FROM ruleta');
    
    if (existingItems[0].count > 0) {
      console.log('✅ Ya existen elementos en la ruleta, saltando inserción...');
      return;
    }

    // Elementos de prueba para la ruleta
    const items = [
      {
        nombre: 'Comodín Especial',
        tipo: 'comodin',
        comodin_id: 1, // Asumiendo que existe un comodín con ID 1
        texto_personalizado: null,
        activo: true
      },
      {
        nombre: '+10 Puntos',
        tipo: 'puntos',
        comodin_id: null,
        texto_personalizado: '+10',
        activo: true
      },
      {
        nombre: 'Bonus Extra',
        tipo: 'personalizado',
        comodin_id: null,
        texto_personalizado: '¡Bonus especial!',
        activo: true
      },
      {
        nombre: '-5 Puntos',
        tipo: 'puntos',
        comodin_id: null,
        texto_personalizado: '-5',
        activo: true
      }
    ];

    // Insertar elementos
    for (const item of items) {
      const [result] = await connection.query(`
        INSERT INTO ruleta (nombre, tipo, comodin_id, texto_personalizado, activo)
        VALUES (?, ?, ?, ?, ?)
      `, [item.nombre, item.tipo, item.comodin_id, item.texto_personalizado, item.activo]);
      
      console.log(`✅ Elemento insertado: ${item.nombre} (ID: ${result.insertId})`);
    }

    console.log('🎉 Todos los elementos de prueba han sido insertados correctamente');

    // Verificar la inserción
    const [finalItems] = await connection.query('SELECT * FROM ruleta');
    console.log('📊 Elementos en la ruleta:', finalItems);

  } catch (error) {
    console.error('❌ Error al insertar elementos de ruleta:', error);
  } finally {
    // Cerrar la conexión
    await connection.end();
    console.log('🔌 Conexión cerrada');
  }
};

// Ejecutar el script
insertRuletaItems();


