#!/bin/bash
# Instalar dependencias
npm ci

# Construir la aplicación
npm run build

# Asegurarse de que la carpeta public existe
mkdir -p public

# Copiar archivos estáticos
cp -r public build/

# Incluir los archivos .env.example en la compilación
cp .env.example build/ 2>/dev/null || :

# Copiar las carpetas necesarias al directorio de salida
mkdir -p /tmp/output
cp -r build /tmp/output/