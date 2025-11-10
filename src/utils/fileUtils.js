/**
 * Extrae el nombre del archivo de una ruta completa
 * @param {string} filePath - Ruta completa del archivo o solo el nombre
 * @returns {string} - Nombre del archivo para usar en la URL
 */
export const getFileNameFromPath = (filePath) => {
  if (!filePath) return '';
  
  // Si ya es solo un nombre de archivo (sin rutas), devolverlo tal cual
  if (!filePath.includes('/') && !filePath.includes('\\')) {
    return filePath;
  }
  
  let fileName = filePath;
  
  // Intentar extraer desde 'uploads/'
  if (fileName.includes('uploads/')) {
    fileName = fileName.split('uploads/')[1];
  } 
  // Intentar extraer desde 'uploads\' (Windows)
  else if (fileName.includes('uploads\\')) {
    fileName = fileName.split('uploads\\')[1];
  } 
  // Si tiene barras invertidas (Windows)
  else if (fileName.includes('\\')) {
    fileName = fileName.split('\\').pop();
  } 
  // Si tiene barras normales (Unix)
  else if (fileName.includes('/')) {
    fileName = fileName.split('/').pop();
  }
  
  return fileName;
};

/**
 * Construye la URL completa para acceder a un archivo
 * @param {string} filePath - Ruta del archivo (puede ser ruta completa o solo nombre)
 * @param {string} baseUrl - URL base del servidor (default: http://localhost:5000)
 * @returns {string} - URL completa del archivo
 */
export const getFileUrl = (filePath, baseUrl = 'http://localhost:5000') => {
  const fileName = getFileNameFromPath(filePath);
  return `${baseUrl}/uploads/${fileName}`;
};

