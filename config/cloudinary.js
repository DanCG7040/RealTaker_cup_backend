import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import streamifier from 'streamifier';

// Cargar variables de entorno
dotenv.config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Función para subir archivos a Cloudinary desde un buffer
export const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: 'general',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [{ width: 800, height: 600, crop: 'limit' }]
    }, (error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Configurar el almacenamiento para juegos
const storageJuegos = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'juegos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Configurar el almacenamiento para logros
const storageLogros = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'logros',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Configurar el almacenamiento para comodines
const storageComodines = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'comodines',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Configurar el almacenamiento para perfiles
const storagePerfiles = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'perfiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 300, height: 300, crop: 'limit' }]
  }
});

// Configurar multer para diferentes tipos de contenido
const uploadJuegos = multer({ storage: storageJuegos });
const uploadLogros = multer({ storage: storageLogros });
const uploadComodines = multer({ storage: storageComodines });
const uploadPerfiles = multer({ storage: storagePerfiles });

// Mantener compatibilidad con el código existente
const storage = storagePerfiles;
const upload = uploadPerfiles;

export { cloudinary, uploadJuegos, uploadLogros, uploadComodines, uploadPerfiles, storage, upload }; 