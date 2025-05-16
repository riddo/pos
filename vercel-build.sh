#!/bin/bash
# Instalar dependencias
npm ci

# Construir la aplicación
npm run build

# Copiar las carpetas necesarias al directorio de salida
mkdir -p /tmp/output
cp -r build /tmp/output/
