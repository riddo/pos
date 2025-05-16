# Instrucciones para configurar el proyecto InertiaPOS

## 1. Clonar el repositorio
Clona el repositorio en tu máquina local ejecutando el siguiente comando:
```bash
git clone <URL_DEL_REPOSITORIO>
```

## 2. Instalar dependencias
Posiciónate en el directorio del proyecto `./inertiaPOS` y ejecuta el siguiente comando en una terminal de Linux:
```bash
npm install
```

## 3. Configuración de la base de datos
1. Crear una nueva base de datos en tu servidor de bases de datos.
2. Configurar el archivo `.env` rellenando los siguientes campos (puedes usar `.env.example` como referencia):

```env
TZ=UTC
PORT=3333                         # Puerto que ocupa la página web (puede ser cualquier puerto disponible)
HOST=localhost
LOG_LEVEL=info
APP_KEY=                          # Se genera con "node ace generate:key"
NODE_ENV=development
SESSION_DRIVER=cookie
DB_HOST=127.0.0.1
DB_PORT=5000                      # Puerto del servidor de la BD (se encuentra en sus propiedades)
DB_USER=postgres                  # Usuario del servidor de BD (se encuentra en sus propiedades)
DB_PASSWORD=$$$$                  # Contraseña del servidor de BD
DB_DATABASE=NeoAdonisJS           # Nombre de la base de datos creada
```

## 4. Generar APP_KEY
Ejecuta el siguiente comando para generar la clave de aplicación:
```bash
node ace generate:key
```

## 5. Instalación de extensiones recomendadas
Para mejorar la experiencia de desarrollo, se recomienda instalar las siguientes extensiones en Visual Studio Code o Cursor:

- **Shadcn/vue**  
- **Vue**  
- **Material Icon Theme**  
- **.NET Install Tool**  
- **Thunder Client**  

---
Con estos pasos, tu entorno debería estar listo para ejecutar y desarrollar en el proyecto InertiaPOS.

