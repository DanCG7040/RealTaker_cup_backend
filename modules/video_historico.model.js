import connection from '../db.js';

export const crearVideoHistorico = async (video) => {
  const { titulo, url, juego_id, partida_id, idEdicion, tipo_partida } = video;
  const [result] = await connection.query(
    `INSERT INTO videos_historicos (titulo, url, juego_id, partida_id, idEdicion, tipo_partida)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [titulo, url, juego_id, partida_id, idEdicion, tipo_partida]
  );
  return result.insertId;
};

export const obtenerVideosHistoricos = async () => {
  const [rows] = await connection.query(
    `SELECT vh.*, j.nombre as juego_nombre, p.fecha as partida_fecha, e.fecha_inicio as edicion_inicio
     FROM videos_historicos vh
     JOIN juegos j ON vh.juego_id = j.id
     JOIN partidas p ON vh.partida_id = p.id
     JOIN edicion e ON vh.idEdicion = e.idEdicion
     ORDER BY vh.fecha_creacion DESC`
  );
  return rows;
}; 