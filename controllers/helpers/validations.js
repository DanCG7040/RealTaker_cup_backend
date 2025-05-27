// helpers/validations.js
export const isValidBase64 = (str) => {
    try {
      if (typeof str !== 'string' || str.trim() === '') return false;
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
      return false;
    }
  };
  
  export const validarImagen = (foto) => {
    if (!foto) return true; // Permitir campo vacío
    
    if (typeof foto !== 'string') return false;
    
    // Si es base64 (formato data:image)
    if (foto.startsWith('data:image')) {
      const pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-zA-Z0-9+/]+={0,2}$/;
      if (!pattern.test(foto)) return false;
      
      const base64Data = foto.split(';base64,').pop();
      if (!isValidBase64(base64Data)) return false;
      
      // Validar tamaño máximo (2MB)
      const buffer = Buffer.from(base64Data, 'base64');
      return buffer.length <= 2 * 1024 * 1024; // 2MB
    }
    
    // Si es una URL
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      return urlPattern.test(foto);
    }
    
    return false;
  };