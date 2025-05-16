// vercel.config.mjs
export default {
  // Output directory - donde Vercel buscará los archivos después de la construcción
  output: 'build',

  // Comando para construir la aplicación
  buildCommand: 'npm run build',

  // Punto de entrada para servir la aplicación
  entrypoint: 'build/server.js',

  // Capacidades que Vercel debería habilitar para este proyecto
  capabilities: {
    static: true,
    nodejs: {
      version: '20.x'
    }
  },

  // Rutas para el proyecto
  routes: [
    { src: '/assets/(.*)', dest: '/assets/$1' },
    { src: '/(.*)', dest: '/server.js' }
  ]
}