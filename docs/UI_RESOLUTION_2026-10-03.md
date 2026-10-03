# Resolución de la auditoría UI de Bojana Online

3 de octubre de 2026 · Rama local `fix/ui-audit` · Base `67281cf07d3e2f42f3f2730d42e45169ed290367`.

## Resultado y alcance

Se implementaron correcciones para los 39 hallazgos de la auditoría en la interfaz activa. Esta entrega no equivale a una certificación WCAG ni a un cierre de validación en producción: falta probar visualmente móvil/tablet, zoom 200% y lector de pantalla sobre un preview accesible. La aplicación sigue siendo una demostración con almacenamiento local. Autenticación, permisos entre cuentas, almacenamiento compartido y envío de email requieren un backend; la UI dejó de afirmar esas capacidades.

El estudio trabaja con un borrador; el cliente consulta una copia publicada. Publicar crea una versión, registra autor, fecha y cambios, y no envía mensajes. La respuesta del cliente actualiza su solicitud contextual y conserva las ediciones pendientes del estudio. Las tareas dependientes permanecen bloqueadas hasta resolver los requisitos. El progreso incluye tareas internas y excluye las que están fuera de alcance.

El workspace reúne estructura, edición, archivos, solicitudes, comentarios, dependencias y publicación. El portal organiza necesidades como capítulos, muestra Ahora antes del contenido extenso y conserva recursos/decisiones anteriores. La asignación de esos recursos a tareas es explícita: no se dedujeron relaciones técnicas ni se inventaron entregables.

## Trazabilidad de los 39 hallazgos

| ID | Cambio implementado |
|---|---|
| F01 | Solicitud contextual operable desde el inspector; creación, revisión y reapertura con motivo. |
| F02 | Enlaces reales para archivos disponibles y descarga de adjuntos locales. URLs vacías, `#` y placeholders muestran indisponibilidad. |
| F03 | Revisión con el mismo componente Story y contenido autorizado del portal; avance real, sin plantilla fija de 0%. El aviso usa el avance publicado. |
| F04 | Borrador separado de snapshot publicado, comparación de cambios y registro de versiones. No se publica automáticamente al editar. |
| F05 | Respuestas sobre `task.accionCliente`. Las decisiones anteriores pueden vincularse a un paso; su respuesta actualiza el mismo objeto. |
| F06 | Objeto, contexto, archivos, solicitante y plazo en la solicitud. No se puede aprobar una propuesta que referencia archivos indisponibles. |
| F07 | Configuración persistida y usada para contacto y avisos preparados; errores de escritura visibles. |
| F08 | Email preparado mediante el correo de la persona; no se marcan envío, entrega ni lectura. Compartir es posterior y opcional. |
| F09 | Pesos fuera de la UI activa; progreso por tareas completadas. Comprobaciones internas no completan una solicitud pendiente. |
| F10 | Un workspace de índice, lienzo e inspector; se retiró el segundo flujo de configuración por módulos. |
| F11 | Necesidades como capítulos y recursos dentro del paso. El archivo anterior permanece consultable mientras el estudio asigna contexto. |
| F12 | Ahora al comienzo, con enlaces a las solicitudes pendientes; portada breve y alcance expandible. |
| F13 | Fechas desde el proyecto/paso, sin fechas de relleno. Fechas nuevas validan inicio/fin. |
| F14 | Listas completas y decisiones denominadas como registro, sin contadores que ocultan elementos. |
| F15 | Se quitó la numeración editorial fija y repetida. |
| V01 | Canvas único #F7F7F4 y paleta central del ADN. |
| V02 | Estados y disciplinas monocromáticos, identificados por texto. |
| V03 | Roles tipográficos coherentes: display 56/62 y 38/44 móvil; página 40/46 y 32/38; secciones 28/34 y 24/30. |
| V04 | Cuerpo 16/24, controles 14/20, metadatos 12/18 para información secundaria. |
| V05 | Controles de 2px, diálogos de 4px, bloques editoriales sin radio. |
| V06 | Filas y divisores, superficies abiertas; sin sucesiones de tarjetas y sombras decorativas. |
| V07 | Shell editorial común y ancho de lectura 760px; workspace utiliza el ancho disponible para sus zonas. |
| V08 | Márgenes 16/24/32/48px y paneles temporales para índice e inspector hasta 1023px. Implementación pendiente de medición visual. |
| V09 | Crear proyecto aparece una sola vez en la navegación; acciones de fila secundarias. |
| V10 | Índice contextual en el flujo, sin barra flotante que tape capítulos/footer. |
| V11 | Listado de proyectos ajustado al contenido, capítulos con ritmo 96px desktop/64px móvil y grupos funcionales de 24–32px. |
| V12 | Cambio de página/proyecto lleva foco al contenido; selección de paso lleva foco al inspector. |
| A01 | Documento `lang="es-AR"`. |
| A02 | Field asocia label, id, ayuda y error; selects y controles nativos. |
| A03 | Dialog nativo con showModal, nombre, aria-modal, cierre por cancel/Escape y retorno de foco. El navegador administra el fondo inerte y el foco modal. |
| A04 | Cierres con nombre contextual y texto visible. |
| A05 | Botones/enlaces reales para navegación y selección; detalles/summary para expansión. |
| A06 | Foco visible común de 2px y contraste alto. |
| A07 | Controles con mínimo 44px; filas y superficies adaptables. Pendiente de medición en viewport real. |
| A08 | Estado seleccionado con aria-current/pressed; checkboxes, radios y select exponen sus estados nativos. |
| A09 | Confirmaciones role=status y errores role=alert, persistentes en formularios y diálogos. |
| A10 | Un main, salto al contenido y encabezados ordenados; preview incrustado no añade otro H1. |
| A11 | Media conserva proporciones, utiliza object-contain, títulos/pies y ampliación con diálogo. Stock rotulado como demostración. |
| A12 | Sin pulsos/ping decorativos; tratamiento prefers-reduced-motion. |

## Sistema compartido

- `src/components/ui/System.tsx`: Button, Field, Dialog, ProgressSummary, Feedback, EmptyState, DeliverableRow, VersionHistory, MediaFigure y recuperación de errores.
- `src/index.css`: paleta, espacio, tipografía, foco, dimensiones, responsive y movimiento reducido.
- `src/services/portalService.ts`: proyección visible, publicación, diferencias, bloqueos, respuestas, reapertura y asignación de recursos.
- `src/components/client/Story.tsx` y `Resources.tsx`: historia, acción contextual, comentarios, documentos y media.
- `src/components/studio/Workspace.tsx`, `Screens.tsx` y `ResourceEditor.tsx`: superficies del estudio y edición contextual.

Se comprobaron imports desde `main.tsx` y se archivaron 32 componentes no alcanzables en `archive/ui-v1`. No se eliminaron proyectos, entregables ni revisiones. El código anterior queda fuera del build y del chequeo TypeScript; está disponible para recuperación histórica, no como segunda interfaz activa.

## Verificación ejecutada

- `npm test`: 28 pruebas aprobadas.
- `npm run lint`: TypeScript sin errores.
- `npm run build`: build de producción correcto.
- `git diff --check`: sin errores de espacios.
- Axe sobre HTML renderizado en jsdom: historia, workspace, proyectos, clientes y configuración sin infracciones semánticas detectadas.
- Contraste de ink/muted sobre surface/canvas/soft comprobado matemáticamente. El contraste automático de axe se deshabilitó porque jsdom no hace layout: no se presenta como prueba visual de contraste.
- Pruebas de componentes: asociación de labels, nombre y cancelación del diálogo, retorno de foco y persistencia de configuración tras remontaje. El comportamiento nativo de foco/inert requiere además prueba en navegador real.
- Pruebas de dominio: publicación independiente, privacidad de la proyección, bloqueos/ciclos, validación de respuestas, rechazo de archivos faltantes, migración contextual y versiones, reapertura, cambios de alcance, lectura corrupta y error de cuota.

## Cambios de comportamiento que requieren revisión

1. Los proyectos anteriores no reciben snapshot automáticamente. Deben revisarse y publicarse desde el estudio. Esto evita que los borradores previos se vuelvan visibles sin decisión.
2. El acceso anterior con credenciales de demostración se reemplazó por entradas explícitas a demostración del estudio, cliente responsable y consulta. No hay autenticación de producción.
3. Los recursos anteriores se conservan. Elegir su tarea traslada el recurso y sus revisiones al contexto seleccionado; el cambio requiere publicación.
4. La bienvenida inicial debe publicarse antes de iniciar ejecución de un proyecto nuevo. Cambiar alcance requiere motivo. Un proyecto cerrado debe reabrirse antes de modificar ejecución.
5. Cargas locales limitadas a PDF, imagen o texto, hasta 2 MB por archivo. Los datos se conservan en el navegador; los errores de almacenamiento no anuncian éxito.

## Pendientes concretos

- Preview y revisión visual a 375/390/768/1024/1440px; recorrido completo con teclado, zoom 200% y lector de pantalla.
- Verificar que los archivos/fechas de ejemplo se sustituyan por datos del proyecto real antes de uso operativo. No se fabricaron archivos para reemplazar URLs `#`.
- Backend con autenticación, asignación de clientes/colaboradores, autorización del lado servidor, archivos privados y datos compartidos. Un enlace de referencia local no habilita colaboración entre dispositivos.
- Proveedor de email y eventos reales si se desea enviar desde la aplicación. La preparación actual abre el correo de la persona y nunca declara el mensaje enviado.
- Revisar el PR y sus checks antes de integrar los cambios. La usuaria autorizó explícitamente publicar la rama `fix/ui-audit` y crear el PR el 3 de octubre de 2026.

La rama se prepara para revisión mediante PR. No se modificó el despliegue de producción ni se enviaron mensajes a clientes.
