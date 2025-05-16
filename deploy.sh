#!/bin/bash
echo "====== INICIANDO DESPLIEGUE EN VERCEL ======"

# Instalar dependencias
echo "Instalando dependencias..."
npm install

# Construir la aplicación
echo "Construyendo la aplicación AdonisJS..."
NODE_ENV=production npm run build

# Verificar la construcción
if [ ! -d "build" ]; then
  echo "ERROR: No se pudo crear el directorio build"
  exit 1
fi

if [ ! -f "build/server.js" ]; then
  echo "ERROR: No se encontró el archivo build/server.js"
  exit 1
fi

# Ejecutar migraciones (opcional, descomenta si es necesario)
# echo "Ejecutando migraciones..."
# NODE_ENV=production node build/ace migration:run --force

echo "Creando carpeta public..."
mkdir -p build/public

# Listar archivos para verificar la estructura
echo "Estructura de archivos generada:"
find build -type f | sort

echo "====== CONSTRUCCIÓN COMPLETADA ======"