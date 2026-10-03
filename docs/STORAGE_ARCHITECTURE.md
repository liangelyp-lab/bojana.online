# Archivos del Portal Bojana — MVP con Google Drive

El portal usa Google Drive como proveedor de archivos y SQLite para registrar la conexión, las carpetas, el contexto de las tareas, los permisos y las versiones publicadas. La interfaz sigue el ADN: un entregable pertenece a una tarea dentro de una necesidad y una disciplina. Subir archivos no cambia el avance, no los publica y no envía comunicaciones.

## Alcance implementado

- Configuración del estudio: autorizar acceso al servidor, conectar, reconectar o desconectar Google Drive mediante OAuth.
- Al crear un proyecto con Drive conectado y la sesión de archivos autorizada, crear su carpeta y las carpetas de sus disciplinas seleccionadas.
- En cualquier tarea: subir un archivo o seleccionar un archivo en Drive sin salir del workspace.
- Buscar archivos y paginar dentro de la carpeta de la disciplina. Google Picker permite seleccionar archivos de otras carpetas cuando está configurado.
- Guardar cada carga/selección como archivo separado en la carpeta correspondiente y registrar su versión, nombre, tamaño, fecha, proveedor, proyecto, necesidad y tarea.
- Publicar los entregables de las tareas visibles y conservar borradores internos. Publicación, email y compartir enlace siguen siendo acciones independientes.
- Descargar archivos y exportar Docs/Slides a PDF y Sheets a XLSX, pasando por controles de permisos del servidor. Miniaturas disponibles por ruta autenticada.
- La abstracción del proveedor también incluye mover archivos; no se agrega un gestor de carpetas ni un botón para mover en este MVP. Seleccionar un archivo existente conserva una copia y no mueve el original.

## Organización

```text
Bojana Portal/
  Los Alisos/
    Arquitectura/
    Ingeniería Civil/
    Construcción/
    Diseño/
```

Se crean únicamente las disciplinas elegidas para cada proyecto. La etiqueta operativa `Ingeniería` se traduce a `Ingeniería Civil` en Drive. El portal conserva IDs, no rutas basadas en nombres. Renombrar el proyecto no rompe relaciones ni crea carpetas duplicadas; el nombre original de su carpeta permanece.

La provisión reserva IDs de Drive en SQLite antes de crear carpetas. Si falla una respuesta, el siguiente intento reutiliza los mismos IDs. Si se eliminó una carpeta, se muestra un error que pide restaurarla en Drive; no se crea silenciosamente otra carpeta ni se mueve información. Las mutaciones se serializan en una instancia del servidor.

## Responsabilidades

| Sistema | Responsabilidad |
| --- | --- |
| Portal / React | Historia, edición y selección de archivos en contexto. |
| Servidor / Express | OAuth, permisos, publicación, streaming y acceso al proveedor. |
| SQLite | Credenciales cifradas, sesiones, snapshots de proyectos, carpetas y relaciones de entregables. |
| Google Drive | Contenido de los archivos y espacio de almacenamiento de la cuenta del estudio. |
| Email | Continúa siendo una acción separada; este cambio no implementa Lark ni Resend. |

El portal existente todavía conserva su estado de trabajo general en `localStorage`. SQLite recibe snapshots del proyecto al preparar carpetas y publicar, y es la autoridad de acceso a archivos. **Este cambio no migra toda la edición del proyecto ni el login de demostración a una aplicación multiusuario con base de datos.** Los roles del navegador no autorizan el acceso a Drive: el servidor exige una sesión independiente validada con la clave del estudio. Una migración de proyectos y usuarios debe conservar esta separación antes de desplegar el producto completo con datos sensibles.

## Contrato del proveedor

`server/storage/provider.mjs` define el contrato neutral. `server/storage/google-drive.mjs` implementa:

| Operación | Uso |
| --- | --- |
| `generateId`, `ensureFolder` | Crear carpetas con reintentos que reutilizan IDs. |
| `list` | Buscar y paginar archivos de una carpeta. |
| `metadata` | Leer nombre, tamaño, fecha, formato y capacidades. |
| `upload` | Iniciar carga resumable y transmitir bytes al proveedor. |
| `copy` | Conservar una copia independiente como versión de la tarea. |
| `content`, `thumbnail` | Descargar/exportar y obtener miniaturas autorizadas. |
| `move` | Capacidad disponible para futuros flujos. |

Los clientes reciben IDs del portal y rutas de descarga, sin IDs de Drive ni tokens OAuth. El selector interno del estudio sí recibe IDs del proveedor para elegir archivos. Google Picker necesita un access token temporal, disponible exclusivamente para una sesión autenticada del estudio y mantenido en memoria. Nunca recibe refresh tokens ni secretos OAuth.

OneDrive, Dropbox y SharePoint requieren adaptadores y conexión propios: no se presentan como proveedores ya disponibles.

## Permisos y publicación

- Studio: cookie HttpOnly, SameSite=Lax, Secure en HTTPS, con ocho horas de duración; clave validada por scrypt en el servidor.
- Cliente: cookie limitada a un proyecto, obtenida con su clave o con su enlace de acceso explícitamente habilitado. Ningún ID de archivo sustituye esta autenticación.
- Los enlaces cortos heredados se reemplazan por tokens aleatorios de 32 bytes al publicar un proyecto con Drive y enlace sin contraseña habilitado. Compartir el enlace actualizado ocurre después de publicar.
- El servidor solo entrega versiones publicadas de tareas visibles del proyecto autorizado. Cambiar un borrador no altera el snapshot publicado; volver a publicar revoca acceso a tareas ocultas.
- Modificar la clave o el token del cliente invalida sus sesiones anteriores.
- Publicar no crea permisos `anyone` ni comparte la carpeta de Drive. Los archivos permanecen privados en la cuenta del estudio.
- El MVP toma las claves de cliente que ya están configuradas en el proyecto. Debe existir una clave para acceder a archivos en proyectos que no habilitan un enlace sin contraseña.
- La vista de cliente consulta las versiones publicadas desde el servidor dentro de la disciplina/tarea correspondiente. Los enlaces sin contraseña publicados cargan un snapshot público desde el servidor incluso en un navegador nuevo; se excluyen credenciales, tareas ocultas y notas internas. La edición y resolución de acciones del proyecto, así como el login general por usuario/clave en un navegador nuevo, conservan el comportamiento de demostración existente y necesitan la migración multiusuario del portal.

## Configurar Google

1. Crear un proyecto de Google Cloud para Bojana y habilitar **Google Drive API**. Habilitar **Google Picker API** si se usará selección desde otras carpetas.
2. Configurar la pantalla de consentimiento OAuth y solicitar exclusivamente `https://www.googleapis.com/auth/drive.file`.
3. Crear un cliente OAuth de tipo **Web application**.
4. Registrar el callback exacto:
   - Desarrollo: `http://localhost:3000/api/storage/oauth/callback`.
   - Producción: `https://TU-DOMINIO/api/storage/oauth/callback`.
5. Para Google Picker, crear una API key restringida a la Picker API y a los orígenes autorizados del portal. Configurar también el número del proyecto de Cloud; el cliente OAuth y Picker deben pertenecer al mismo proyecto.
6. Copiar `.env.example` a `.env` y completar los valores locales. No subir `.env` a GitHub.
7. Generar `STORAGE_ENCRYPTION_KEY` con `openssl rand -hex 32`. Conservarla en el gestor de secretos del despliegue: si se pierde, la conexión cifrada no se podrá recuperar.
8. Generar la clave del estudio sin escribirla en el historial de la terminal (Bash):

```bash
read -r -s -p 'Clave de archivos del estudio: ' BOJANA_SETUP_PASSWORD
export BOJANA_SETUP_PASSWORD
node --input-type=module -e "import {hashPassword} from './server/security.mjs'; process.stdout.write(hashPassword(process.env.BOJANA_SETUP_PASSWORD) + '\\n')"
unset BOJANA_SETUP_PASSWORD
```

Guardar el resultado como `STUDIO_PASSWORD_HASH`. Esta clave es independiente de las credenciales de demostración de la app.

9. En el portal: **Configuración → Archivos del estudio → Autorizar acceso → Conectar Google Drive**. Seleccionar la cuenta del estudio y completar el consentimiento.

La autorización solicita acceso offline y guarda el refresh token cifrado con AES-256-GCM en SQLite. Los access tokens se renuevan en el servidor. Se exige la cuenta original al reconectar un estudio que ya tiene carpetas. Desconectar revoca el token de Google, conserva las relaciones y no borra archivos.

OAuth no garantiza conexión eterna: el acceso puede ser revocado o expirar. Una app externa en estado Testing con este scope tiene refresh tokens de siete días; para uso continuo debe configurarse correctamente su publicación/consentimiento. El estado de OAuth está ligado a la sesión del estudio, vence en diez minutos y solo se puede usar una vez.

## Ejecutar

Requiere Node.js 24 o superior (SQLite nativo).

```bash
npm ci
npm run api
```

En otra terminal:

```bash
npm run dev
```

`APP_URL=http://localhost:3000` en desarrollo. Vite reenvía `/api/storage` al servidor del puerto 3001.

Producción:

```bash
npm run build
NODE_ENV=production npm start
```

El servidor sirve la aplicación y la API desde el mismo origen. Desplegar con HTTPS, volumen persistente para `STORAGE_DB_PATH`, secretos y una sola instancia escritora. El almacenamiento local de SQLite no es adecuado para múltiples instancias independientes ni discos efímeros. Para ese escenario, migrar el registro a una base de datos compartida y reemplazar la cola local por un lock distribuido.

## Costos, versiones y recuperación

- El uso estándar de la API de Drive está disponible sin costo adicional, dentro de sus límites. Los archivos y copias consumen el almacenamiento contratado de la cuenta; no es almacenamiento ilimitado ni una garantía de costo cero.
- Drive puede purgar revisiones antiguas de archivos binarios. Por eso este MVP registra archivos separados por versión, en lugar de depender de retención implícita de revisiones.
- Las copias retienen versiones mientras no se borren o modifiquen directamente en Drive. No son archivos inmutables.
- Drive no reemplaza una política de respaldo. Se necesitan respaldos del registro SQLite, de la clave de cifrado y la recuperación/retención adecuada de los archivos del estudio.
- Las descargas pasan por el servidor para aplicar permisos; pueden consumir tráfico y recursos del hosting. No se promete eliminación de todos los costos de transferencia o CDN.
- El límite inicial de carga es 50 MB, configurable con `STORAGE_MAX_UPLOAD_MB`. La carga usa una sesión resumable de Drive con streaming, pero el MVP no implementa reanudación del navegador después de una desconexión; se reintenta desde el inicio. No se guarda el binario en disco del portal.
- Si Drive recibe un archivo pero falla el registro posterior en SQLite, puede quedar un archivo huérfano privado. Este MVP no incluye una cola de reconciliación de archivos huérfanos. Restaurar el registro desde un respaldo y reconciliar sus IDs evita perder el contexto.
- Reintentos acotados para lecturas en cuotas/errores transitorios; no se repiten automáticamente mutaciones que podrían crear copias duplicadas. Se muestran errores de espacio, permisos, reconexión y tamaño.

## Verificación

`npm run lint`, `npm run build`, `npm run test:storage`.

Las pruebas usan un proveedor simulado y SQLite real en memoria: carpetas sin duplicación, carpeta de disciplina correcta, tamaño de carga, contexto de tarea, cifrado, contraseña, CSRF/origen, estado OAuth, versiones separadas, publicación, borradores internos, acceso por proyecto y revocación de sesiones. La conexión OAuth y la API real deben probarse con la cuenta del estudio después de configurar sus credenciales; no se inventan credenciales ni se presenta una simulación como conexión activa.

## Documentación oficial

- [Cuotas y costos estándar](https://developers.google.com/workspace/drive/api/guides/limits)
- [Scope drive.file y Google Picker](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Google Picker para web](https://developers.google.com/workspace/drive/picker/guides/web-picker)
- [OAuth para servidores y acceso offline](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Caducidad de refresh tokens en Testing](https://developers.google.com/identity/protocols/oauth2)
- [Retención de revisiones](https://developers.google.com/workspace/drive/api/guides/manage-revisions)
