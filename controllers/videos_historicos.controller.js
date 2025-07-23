import { crearVideoHistorico, obtenerVideosHistoricos } from '../modules/video_historico.model.js';

export const addVideoHistorico = async (req, res) => {
  try {
    const { titulo, url, juego_id, partida_id, idEdicion, tipo_partida } = req.body;
    if (!titulo || !url || !juego_id || !partida_id || !idEdicion || !tipo_partida) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }
    const id = await crearVideoHistorico({ titulo, url, juego_id, partida_id, idEdicion, tipo_partida });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error al añadir video:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const getVideosHistoricos = async (req, res) => {
  try {
    const videos = await obtenerVideosHistoricos();
    res.json({ success: true, data: videos });
  } catch (error) {
    console.error('Error al obtener videos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}; 