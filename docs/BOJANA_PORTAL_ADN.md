# ADN de producto y sistema de interfaz del Portal de Clientes

**Bojana Estudio**

Guía maestra para diseñar y construir una experiencia coherente entre el portal del cliente y el espacio de trabajo del estudio.

**Versión 1.1**  
3 de octubre de 2026

Donde la ingeniería encuentra la forma

# Propósito de esta guía

El portal debe mostrar el proyecto como un proceso claro y acompañado. La interfaz mantiene el lenguaje sobrio de Bojana y convierte el avance técnico en una historia que el cliente puede comprender, consultar y aprobar.

Esta guía fija las decisiones que deben mantenerse constantes al crear pantallas, flujos, componentes y contenido. También define el modelo de información que conecta el trabajo interno con lo que se publica al cliente. Cualquier pantalla nueva debe poder justificarse a partir de estas reglas.

## Decisiones fundacionales

- El cliente recorre una sola historia evolutiva del proyecto. No recibe un dashboard compuesto por módulos independientes.

- El equipo trabaja en un único workspace por proyecto. La edición, el contexto y las acciones se mantienen juntos.

- Todo proyecto comienza en 0 por ciento después de aprobar el presupuesto, aunque ya contenga información base y documentos técnicos.

- El avance se calcula a partir de tareas terminadas. No se edita como un porcentaje libre.

- Las acciones del cliente aparecen dentro de la etapa que las necesita. Pueden bloquear el trabajo siguiente y cambiar el estado a Esperando al cliente.

- Publicar en el portal, avisar por email y copiar un enlace son acciones distintas. La comunicación siempre es opcional y manual.

- Los comentarios, aprobaciones y entregables deben conservar el contexto del punto de la historia donde ocurrieron.

## Cómo usarla

Producto la usa para decidir jerarquías y comportamiento. Diseño la usa para construir layouts y componentes. Desarrollo la usa como contrato de implementación. Contenido la usa para nombrar estados y acciones. Las excepciones deben documentarse; no se resuelven agregando un patrón nuevo por pantalla.

## Índice de trabajo

<table>
<colgroup>
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Parte</strong></th>
<th><strong>Contenido</strong></th>
<th><strong>Parte</strong></th>
<th><strong>Contenido</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>01<br />
02<br />
03</td>
<td>Modelo del producto y lenguaje común<br />
Arquitectura de experiencia y layouts<br />
Sistema visual y tokens</td>
<td>04<br />
05<br />
06</td>
<td>Componentes, estados e interacción<br />
Contenido, accesibilidad y gobierno<br />
Paquete mínimo para comenzar el diseño</td>
</tr>
</tbody>
</table>

**PARTE 01**

# Modelo del producto y lenguaje común

La interfaz nace de una estructura única. Cada elemento que el equipo crea debe tener un lugar claro dentro del proyecto y una forma comprensible de aparecer en el portal.

## Jerarquía del proyecto

| **Nivel**          | **Definición**                                         | **Regla de interfaz**                                                                                           |
|--------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Proyecto           | Unidad completa contratada y visible para un cliente.  | Contiene ADN, alcance, plazo, disciplinas, personas y una historia única.                                       |
| Disciplina         | Área de trabajo que participa en el proyecto.          | Arquitectura, Ingeniería Civil, Diseño o Construcción. Funciona como eje y filtro, no como aplicación separada. |
| Necesidad          | Resultado o problema concreto que debe resolverse.     | Agrupa el trabajo y explica para qué existe. Es el nivel principal de comprensión para el cliente.              |
| Etapa              | Agrupación opcional de tareas dentro de una necesidad. | Se usa solo cuando ayuda a entender una secuencia. No debe convertirse en una capa obligatoria vacía.           |
| Tarea              | Unidad mínima de trabajo que modifica el avance.       | Tiene responsable, estado, visibilidad, dependencias y puede contener entregables o recursos.                   |
| Entregable         | Resultado consultable o descargable.                   | Siempre pertenece a una tarea o decisión; no queda aislado en un repositorio sin contexto.                      |
| Acción del cliente | Aprobación, selección, confirmación o envío requerido. | Vive dentro de la tarea que la necesita y puede bloquear las siguientes.                                        |

## ADN del proyecto

El ADN se completa al crear el proyecto desde el espacio administrativo. Define lo que la interfaz necesita para ordenar el trabajo y generar el portal inicial.

| **Campo**        | **Qué contiene**                                        | **Uso**                                                            |
|------------------|---------------------------------------------------------|--------------------------------------------------------------------|
| Identidad        | Nombre, cliente, ubicación, tipo de proyecto y portada. | Encabezado y contexto persistente.                                 |
| Propósito        | Resultado esperado en lenguaje claro.                   | Introducción del portal y criterio para priorizar necesidades.     |
| Alcance          | Qué incluye y qué queda fuera.                          | Control de cambios y lectura común del contrato.                   |
| Plazo            | Fecha estimada y hitos relevantes.                      | Orientación temporal sin prometer fechas no confirmadas.           |
| Disciplinas      | Áreas de Bojana que participan.                         | Organización de necesidades y responsables.                        |
| Orden de trabajo | Necesidades, etapas, tareas y dependencias.             | Genera la estructura operativa y el cálculo de avance.             |
| Siguiente acción | Primer movimiento del estudio o del cliente.            | Evita un portal vacío y guía la bienvenida.                        |
| Base documental  | Presupuesto aprobado y documentos técnicos disponibles. | Consulta desde el inicio sin alterar el 0 por ciento de ejecución. |

## Ciclo de vida

| **Momento**          | **Acción del estudio**                                       | **Experiencia del cliente**                                                                      |
|----------------------|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| Presupuesto aprobado | Crea el proyecto y registra el ADN.                          | Todavía no recibe acceso.                                                                        |
| Preparación          | Carga alcance, plazo, disciplinas, orden y documentos base.  | El progreso permanece en 0 por ciento.                                                           |
| Portal inicial       | Genera y publica la bienvenida.                              | Ve el tipo de proyecto, el alcance, las disciplinas, la documentación inicial y el próximo paso. |
| Bienvenida           | Envía email o comparte el enlace cuando lo decide.           | Recibe una invitación; el email avisa y el portal conserva la información.                       |
| Ejecución            | Actualiza tareas, entregables y entradas de la historia.     | Sigue el avance y consulta decisiones en contexto.                                               |
| Espera del cliente   | Solicita una acción y bloquea lo dependiente si corresponde. | Encuentra una petición clara, fecha si existe y consecuencia de no responder.                    |
| Cierre               | Confirma tareas terminadas y publica el cierre.              | Consulta el resultado, los entregables finales y el registro del proyecto.                       |

## Regla de avance

En la primera versión, todas las tareas activas dentro del alcance tienen el mismo peso. El sistema calcula el porcentaje y lo redondea al entero más cercano.

**Fórmula** tareas completadas ÷ tareas activas dentro del alcance × 100

**Incluye** tareas visibles y no visibles que forman parte real de la ejecución.

**No suma avance** en progreso, en revisión, esperando al cliente o pausada.

**Excluye** tareas canceladas o marcadas fuera de alcance.

**Control** el porcentaje no admite edición manual. Cambiar el alcance exige registrar el cambio.

El portal puede ocultar el detalle de una tarea interna, pero no debe recalcular el progreso según lo publicado. Así el avance no cambia artificialmente cuando una tarea se vuelve visible.

## Estados canónicos

| **Estado interno**   | **Etiqueta para el cliente** | **Efecto**                                                 |
|----------------------|------------------------------|------------------------------------------------------------|
| No iniciada          | Próximamente                 | Permanece en la secuencia sin actividad.                   |
| En curso             | En desarrollo                | Muestra el trabajo actual.                                 |
| En revisión          | En revisión                  | Indica control del estudio o validación técnica.           |
| Esperando al cliente | Esperando tu respuesta       | Destaca la acción requerida y puede bloquear lo siguiente. |
| Pausada              | En pausa                     | Debe incluir una explicación publicada.                    |
| Completada           | Completado                   | Suma al avance y conserva fecha de cierre.                 |
| Fuera de alcance     | No se muestra                | Sale del cálculo sin borrarse del registro interno.        |

**PARTE 02**

# Arquitectura de experiencia y layouts

Las dos superficies comparten datos, pero no la misma lógica visual. El cliente lee una historia. El equipo edita esa historia y administra el trabajo desde un solo espacio.

## Portal del cliente

La navegación es corta y contextual. Cada proyecto abre directamente en su historia. Documentos, decisiones y comentarios aparecen donde adquieren sentido.

> 1\. Header compacto con marca Bojana, nombre del proyecto, progreso y acceso a cuenta o ayuda.
>
> 2\. Portada con identidad, propósito, alcance resumido, disciplinas y fecha de última actualización.
>
> 3\. Bloque Ahora con el momento actual, el próximo paso y cualquier acción requerida.
>
> 4\. Project Story en orden editorial. Las entradas recientes se leen primero en la vista diaria; la historia completa mantiene secuencia cronológica navegable.
>
> 5\. Necesidades como capítulos. Las disciplinas funcionan como etiquetas o anclas transversales.
>
> 6\. Entregables, recursos, comentarios y aprobaciones insertados dentro de su entrada o tarea.
>
> 7\. Cierre con estado final, archivos definitivos y contacto del estudio.

## Workspace del estudio

El workspace evita saltar entre aplicaciones internas. Mantiene estructura, edición y propiedades en una misma pantalla.

| **Zona**            | **Ancho de referencia** | **Contenido**                                                                                    |
|---------------------|-------------------------|--------------------------------------------------------------------------------------------------|
| Cabecera contextual | alto 64 px              | Selector de proyecto, estado, progreso interno, vista previa y Publicar.                         |
| Índice izquierdo    | 240 px                  | Necesidades, disciplinas, tareas y búsqueda. Se puede contraer.                                  |
| Lienzo central      | mínimo 640 px           | Historia y estructura editable en el mismo orden que verá el cliente.                            |
| Inspector derecho   | 320 px                  | Estado, responsable, visibilidad, dependencias, fechas y comunicación del elemento seleccionado. |

Crear una tarea, adjuntar un entregable, solicitar una aprobación o publicar una entrada debe ocurrir sin abandonar el lienzo. El inspector cambia según la selección y se cierra cuando no hace falta.

## Grilla responsiva

| **Rango**      | **Grilla**                                      | **Márgenes** | **Comportamiento**                                                    |
|----------------|-------------------------------------------------|--------------|-----------------------------------------------------------------------|
| 1440 px o más  | 12 columnas, gutter 24 px, shell máximo 1220 px | 48 a 64 px   | Portal centrado. Admin usa tres zonas.                                |
| 1024 a 1439 px | 12 columnas, gutter 20 px                       | 32 px        | Inspector puede superponerse como panel.                              |
| 768 a 1023 px  | 8 columnas, gutter 20 px                        | 24 px        | Índice e inspector pasan a drawers. El lienzo ocupa el ancho.         |
| Hasta 767 px   | 4 columnas, gutter 16 px                        | 16 px        | Una columna. Acciones principales fijas solo mientras son necesarias. |

## Reglas de composición

- Alinear logo, títulos, texto y contenido principal al mismo eje izquierdo.

- Usar un ancho de lectura de 640 a 760 px para texto largo. Los planos, renders y comparativas pueden ocupar el shell completo.

- Separar capítulos con espacio y líneas finas. Evitar encerrar cada bloque en una tarjeta.

- Reservar el negro pleno para navegación, acciones primarias y momentos de inversión controlada.

- Mantener una sola acción primaria por zona visible.

- Conservar el contexto del proyecto en overlays, drawers y modales mediante título y origen.

## Plantillas principales

| **Plantilla**           | **Debe contener**                                                                         | **No debe contener**                                              |
|-------------------------|-------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| Bienvenida 0 por ciento | Portada, propósito, alcance, disciplinas, documentos base y siguiente paso.               | Widgets vacíos, métricas sin actividad o mensajes de celebración. |
| Proyecto activo         | Ahora, progreso, historia, necesidades, entregables y actividad relevante.                | Paneles independientes que repitan la misma información.          |
| Acción requerida        | Pregunta concreta, contexto, opciones o carga, fecha si existe y efecto sobre el trabajo. | Alertas genéricas o aprobaciones sin objeto visible.              |
| Presentación en reunión | Historia limpia, media ampliada, comentarios y decisión en contexto.                      | Controles administrativos o datos internos.                       |
| Cierre                  | Resumen, 100 por ciento, entregables finales, decisiones y contacto.                      | Tareas canceladas, borradores o notas internas.                   |

## Densidad y ritmo

**Sección editorial** 80 a 120 px entre capítulos en desktop; 56 a 72 px en mobile.

**Bloque funcional** 24 a 40 px entre grupos relacionados; 12 a 16 px dentro del grupo.

**Fila operativa** mínimo 48 px; 56 px cuando incluye estado o acción secundaria.

**Contenido persistente** header compacto. Evitar barras fijas adicionales que reduzcan el área útil.

**PARTE 03**

# Sistema visual y tokens

La guía `DESIGN.md` del proyecto es la fuente de verdad para la capa visual del portal y el workspace. Se adopta su sistema editorial de superficies blancas, tinta oscura, tipografía sans basada en Haas con fallbacks locales, primarios casi negros, acentos de marca documentados y radios consistentes de 10 a 12 px. Esta decisión reemplaza la paleta monocromática estricta de la versión 1.0. El ADN de producto conserva la autoridad sobre arquitectura, datos, estados, permisos, publicación, accesibilidad y microcopy.

En la interfaz operativa, los colores coral, verde, crema y azul se limitan a las superficies y estados semánticos previstos por `DESIGN.md`. Ningún estado depende solo del color. El portal mantiene una historia de proyecto continua y el workspace permanece unificado. El índice de la historia es contextual y no fijo para preservar área útil.

## Paleta

| **Token**     | **Valor** | **Uso**                                                        |
|---------------|-----------|----------------------------------------------------------------|
| color.canvas      | \#FFFFFF  | Fondo principal.                                                 |
| color.surface-soft | \#F8FAFC | Bandas suaves, filas alternas y selección.                       |
| color.ink         | \#181D26  | Texto principal, navegación y acción primaria.                  |
| color.body        | \#333840  | Texto de lectura.                                                |
| color.muted       | \#5F6670  | Metadatos y texto secundario con contraste suficiente.          |
| color.hairline    | \#DDDDDD  | Divisores y bordes.                                              |
| color.coral       | \#AA2D00  | Acento de marca y alertas cálidas.                               |
| color.forest      | \#0A2E0E  | Estado de éxito y acento secundario documentado.                 |
| color.link        | \#1B61C9  | Enlaces y foco visible.                                          |
| color.inverse     | \#FFFFFF  | Texto sobre fondos oscuros.                                      |

Los estados se distinguen por texto, icono, forma y posición. No dependen de verde, amarillo o rojo. Los errores críticos pueden incorporar un color semántico en una fase posterior, siempre como apoyo y nunca como único indicador.

## Tipografía

| **Rol**              | **Desktop**       | **Mobile**        | **Regla**                                 |
|----------------------|-------------------|-------------------|-------------------------------------------|
| Display de proyecto  | 56/62 serif       | 38/44 serif       | Solo portada y hitos editoriales.         |
| Título de página     | 40/46 serif       | 32/38 serif       | Un H1 por vista.                          |
| Título de sección    | 28/34 serif       | 24/30 serif       | Capítulos de la historia.                 |
| Título de componente | 18/24 sans medium | 17/22 sans medium | Necesidades, acciones y entregables.      |
| Cuerpo               | 16/24 sans        | 16/24 sans        | Lectura principal. No reducir en mobile.  |
| UI                   | 14/20 sans medium | 14/20 sans medium | Botones, tabs y controles.                |
| Metadato             | 12/18 sans        | 12/18 sans        | Uso corto. Nunca para contenido esencial. |

**Familias de referencia** Haas Groot Display para títulos y Haas para interfaz. Si las fuentes propietarias no están instaladas, usar `Inter`, `system-ui`, `-apple-system`, `Segoe UI` y sans-serif en ese orden. No solicitar las fuentes a servicios externos desde producción.

**Peso** regular como base, medium para acciones y etiquetas. Bold solo para alertas o énfasis puntuales.

**Tracking** ligeramente abierto en navegación y metadatos; normal en párrafos.

## Escala espacial

| **Token** | **Valor** | **Aplicación**                               |
|-----------|-----------|----------------------------------------------|
| space.1   | 4 px      | Ajuste mínimo entre icono y microcontenido.  |
| space.2   | 8 px      | Elementos muy relacionados.                  |
| space.3   | 12 px     | Interior compacto y separación de metadatos. |
| space.4   | 16 px     | Padding mobile e inputs.                     |
| space.6   | 24 px     | Grupos de controles y gutter base.           |
| space.8   | 32 px     | Bloques funcionales.                         |
| space.12  | 48 px     | Secciones pequeñas.                          |
| space.16  | 64 px     | Secciones de página.                         |
| space.24  | 96 px     | Capítulos editoriales.                       |

## Forma, borde y elevación

**Borde** 1 px color.line. Usar 2 px solo para foco visible.

**Radio** 0 px en bloques editoriales; 2 px en inputs y botones; 4 px máximo en overlays.

**Sombra** ninguna en la superficie base. Sombra suave solo en drawers, menús y modales.

**Iconos** 16 o 20 px, trazo 1.5 px, geometría simple. El botón primario no necesita icono decorativo.

**Imagen** sin esquinas redondeadas por defecto. Mantener proporción y fidelidad técnica; nunca recortar información esencial de planos o renders.

## Movimiento

| **Tipo**                  | **Duración** | **Uso**                                          |
|---------------------------|--------------|--------------------------------------------------|
| Microestado               | 120 a 160 ms | Hover, focus y selección.                        |
| Expansión                 | 200 a 260 ms | Acordeón, detalles y panel lateral.              |
| Cambio de contexto        | 280 a 360 ms | Drawer, modal o navegación interna.              |
| Actualización de progreso | 400 a 600 ms | Solo después de confirmar el cambio; sin rebote. |

El movimiento explica continuidad y estado. Debe respetar prefers-reduced-motion y no retrasar acciones de trabajo.

**PARTE 04**

# Componentes, estados e interacción

Los componentes se organizan por función. La superficie predeterminada es abierta y plana; un contenedor aparece solo cuando hay una acción, una selección o una capa temporal que necesita límite.

## Navegación y contexto

| **Componente**        | **Anatomía**                              | **Variantes**                              |
|-----------------------|-------------------------------------------|--------------------------------------------|
| Portal Header         | marca, proyecto, progreso, cuenta o ayuda | desktop, compacto, mobile                  |
| Admin Header          | selector, estado, vista previa, publicar  | guardado, cambios sin publicar, publicando |
| Project Switcher      | nombre, cliente, búsqueda                 | recientes, todos, sin resultados           |
| Story Index           | necesidades, etapa actual, anclas         | expandido, contraído, drawer               |
| Breadcrumb contextual | proyecto, necesidad, elemento             | solo admin y overlays profundos            |

## Estructura del proyecto

| **Componente**    | **Contenido obligatorio**                           | **Regla**                                                      |
|-------------------|-----------------------------------------------------|----------------------------------------------------------------|
| Project Cover     | nombre, propósito, tipo, ubicación, actualización   | La imagen es opcional. La jerarquía funciona sin ella.         |
| Progress Summary  | porcentaje, estado actual y texto de contexto       | No usar anillos ni gráficos decorativos.                       |
| Discipline Marker | nombre de disciplina                                | Etiqueta pequeña; no se convierte en pestaña obligatoria.      |
| Need Chapter      | título, explicación, estado y avance local opcional | Es la unidad principal de lectura del cliente.                 |
| Stage Divider     | nombre y estado                                     | Solo cuando ordena varias tareas.                              |
| Task Row          | nombre, estado, responsable interno y visibilidad   | El cliente recibe el término Paso cuando haga falta mostrarla. |

## Historia y entregables

| **Componente**  | **Uso**                               | **Contenido**                                                                |
|-----------------|---------------------------------------|------------------------------------------------------------------------------|
| Story Entry     | Publicar un avance con contexto.      | fecha, título, explicación, disciplina, media y relación con tarea.          |
| Media Figure    | Mostrar render, plano, foto o video.  | archivo, pie descriptivo, versión y opción de ampliar.                       |
| Comparison      | Comparar alternativas o revisiones.   | dos o más vistas con labels consistentes y zoom sincronizado cuando aplique. |
| Deliverable Row | Consultar o descargar un resultado.   | nombre, tipo, versión, fecha, tamaño y acción.                               |
| Version History | Conservar trazabilidad.               | versión, autor, fecha y motivo del cambio.                                   |
| Comment Thread  | Conversar sobre un objeto específico. | autor, hora, texto, adjunto, estado resuelto.                                |

## Acciones y decisiones del cliente

| **Tipo**            | **Control principal**       | **Confirmación**                                                |
|---------------------|-----------------------------|-----------------------------------------------------------------|
| Aprobar             | Aprobar o Solicitar cambios | Resumen del objeto aprobado y registro de fecha.                |
| Seleccionar         | Opciones comparables        | La opción elegida queda visible y bloquea cambios accidentales. |
| Enviar información  | Campo o formulario breve    | Vista de lo enviado y posibilidad de corregir antes del cierre. |
| Subir documentación | Uploader con requisitos     | Nombre, versión, tamaño y estado de carga.                      |
| Confirmar           | Confirmar y campo opcional  | Texto exacto de lo confirmado.                                  |

**Siempre mostrar** qué se necesita, por qué, sobre qué elemento, quién lo solicita, fecha límite si existe y qué trabajo depende de la respuesta.

**Después de responder** la acción cambia a Respondida, registra autor y fecha, y desbloquea lo dependiente según la regla configurada.

**Reapertura** solo el estudio puede reabrir una acción cerrada. La razón queda registrada.

## Controles de edición

| **Componente**     | **Estados mínimos**                                           | **Regla**                                             |
|--------------------|---------------------------------------------------------------|-------------------------------------------------------|
| Button             | primary, secondary, text, destructive, disabled, loading      | Una primaria por zona. Sin icono decorativo.          |
| Text Field         | default, focus, filled, error, disabled, readonly             | Label siempre visible; placeholder solo como ejemplo. |
| Text Area          | compacta, amplia, contador opcional                           | Crece hasta un máximo y luego hace scroll.            |
| Select             | cerrado, abierto, seleccionado, error                         | Usar búsqueda cuando hay más de diez opciones.        |
| Status Select      | lista canónica                                                | No permitir crear estados libres.                     |
| Date Input         | sin fecha, fecha, rango, error                                | Explicar si la fecha es estimada o confirmada.        |
| Uploader           | idle, drag, uploading, success, error                         | Mantener requisitos y progreso visibles.              |
| Visibility Control | interno, portal, programado                                   | Nunca publicar por cambiar el estado de una tarea.    |
| Publish Control    | sin cambios, cambios pendientes, publicando, publicado, error | Incluye revisión previa de lo visible.                |

## Superficies temporales

**Popover** elección breve vinculada a un control. Se cierra al seleccionar o al hacer clic fuera.

**Drawer** inspector, detalle o edición que necesita contexto visible. En tablet y mobile reemplaza columnas laterales.

**Modal** decisión que bloquea el flujo, como publicar, eliminar o confirmar una aprobación. No se usa para lectura extensa.

**Toast** confirma acciones reversibles y no sustituye un error dentro del formulario.

## Estados transversales

| **Estado**        | **Tratamiento**                                                                |
|-------------------|--------------------------------------------------------------------------------|
| Vacío inicial     | Explica qué aparecerá y ofrece una sola acción para comenzar.                  |
| Sin resultados    | Conserva filtros visibles y permite limpiarlos.                                |
| Carga             | Skeleton que respeta la estructura real; evitar spinner de página completa.    |
| Guardando         | Indicador discreto junto al contexto editado.                                  |
| Guardado          | Confirmación persistente breve; no toast repetitivo por autoguardado.          |
| Error recuperable | Mensaje junto al control, causa en lenguaje claro y acción para reintentar.    |
| Error de página   | Conserva header y contexto, explica qué no cargó y ofrece reintento.           |
| Sin conexión      | Permite leer lo cargado y bloquea publicar o aprobar hasta recuperar conexión. |
| Sin permiso       | Explica el límite sin revelar contenido interno.                               |

# Visibilidad, publicación y comunicación

Estos tres conceptos no se mezclan. La visibilidad define qué puede aparecer. La publicación actualiza el portal. La comunicación avisa que existe una actualización.

| **Capa**     | **Pregunta que responde**                            | **Acción**                                          |
|--------------|------------------------------------------------------|-----------------------------------------------------|
| Visibilidad  | ¿Este contenido es interno o puede verlo el cliente? | Marcar como Interno o Portal.                       |
| Publicación  | ¿La versión visible ya debe estar en línea?          | Revisar cambios y Publicar.                         |
| Comunicación | ¿Debemos avisar ahora?                               | Enviar email o Copiar enlace. Ambas son opcionales. |

## Flujo de publicación

> 1\. El equipo edita contenido y define su visibilidad.
>
> 2\. La cabecera muestra que existen cambios sin publicar.
>
> 3\. Publicar abre una revisión de entradas, archivos, acciones y cambios de estado que verá el cliente.
>
> 4\. Al confirmar, el portal actualiza su versión y registra autor y fecha.
>
> 5\. El sistema ofrece Enviar email y Copiar enlace como acciones posteriores independientes.

## Reglas de seguridad de contenido

- Las notas internas, responsables internos, costos no autorizados y borradores nacen como Interno.

- Un archivo hereda la visibilidad de su entrega, pero debe poder restringirse de forma explícita.

- La vista previa del cliente usa los mismos permisos que la versión publicada.

- Eliminar contenido publicado requiere confirmación y deja registro. Cuando corresponde, se reemplaza por una nueva versión en vez de borrar la historia.

- Cada cliente accede solo a los proyectos y archivos que le fueron asignados.

## Comentarios y reuniones

Los comentarios pertenecen al objeto que se está revisando: una entrada, imagen, archivo, opción o aprobación. El portal puede usarse durante una reunión con la misma información publicada. Las decisiones tomadas allí se registran en el hilo y actualizan la acción correspondiente. El email solo dirige al portal; no se convierte en la fuente principal de la decisión.

## Dependencias y bloqueo

**Dependencia** una tarea puede requerir que otra tarea o una acción del cliente esté completada.

**Bloqueo** la tarea dependiente no puede marcarse En curso mientras la condición siga abierta, salvo anulación registrada por el estudio.

**Vista del cliente** se muestra la consecuencia útil, por ejemplo El diseño continúa cuando confirmes esta alternativa. No se expone la lógica interna completa.

**Vista del estudio** el inspector muestra origen, elementos bloqueados y opción de cambiar o anular la dependencia.

**PARTE 05**

# Contenido, accesibilidad y gobierno

La consistencia también depende de las palabras, del comportamiento con teclado y de cómo se incorporan cambios al sistema. Una pantalla visualmente correcta no está terminada si su estado es ambiguo o inaccesible.

## Voz y contenido

| **Principio**         | **Aplicación**                                         | **Ejemplo**                                    |
|-----------------------|--------------------------------------------------------|------------------------------------------------|
| Claro                 | Nombrar la acción y el objeto.                         | Aprobar propuesta de distribución.             |
| Cercano               | Hablar al cliente de vos sin exagerar la informalidad. | Necesitamos tu confirmación para continuar.    |
| Técnico cuando aporta | Explicar términos en su primer uso.                    | Anteproyecto seguido de una descripción breve. |
| Concreto              | Indicar estado, fecha y consecuencia.                  | Esperando tu respuesta desde el 2 de octubre.  |
| Calmo                 | Evitar urgencia artificial y signos repetidos.         | La carga falló. Probá nuevamente.              |

## Nombres canónicos de interfaz

| **Concepto**       | **Usar**                     | **Evitar**                     |
|--------------------|------------------------------|--------------------------------|
| Acción principal   | Publicar cambios             | Sincronizar, Lanzar            |
| Acción del cliente | Esperando tu respuesta       | Pending, Bloqueado por cliente |
| Entrega            | Entregable                   | Asset, Output                  |
| Unidad visible     | Paso                         | Ticket, Task                   |
| Historia           | Actualizaciones del proyecto | Feed                           |
| Fecha              | Última actualización         | Last sync                      |
| Error              | No pudimos cargar el archivo | Algo salió mal                 |

## Reglas de microcopy

- Botones con verbo y objeto cuando exista riesgo de ambigüedad: Publicar cambios, Aprobar alternativa, Descargar plano.

- Estados en presente y sin punto: En desarrollo, En revisión, Esperando tu respuesta.

- Fechas completas en decisiones y aprobaciones; fechas relativas solo como apoyo cercano.

- Mensajes de error con tres partes cuando aplique: qué falló, qué se conservó y qué puede hacer la persona.

- Confirmaciones destructivas nombran el objeto exacto y la consecuencia. No usar Está seguro como único mensaje.

- No repetir el slogan de marca dentro de las pantallas operativas.

## Accesibilidad mínima

| **Área**      | **Requisito**                                                                                             |
|---------------|-----------------------------------------------------------------------------------------------------------|
| Contraste     | WCAG AA: 4.5 a 1 en texto normal y 3 a 1 en texto grande e indicadores gráficos.                          |
| Teclado       | Todo control operable sin mouse, con orden lógico y foco visible de 2 px.                                 |
| Tamaño táctil | Objetivo mínimo 44 por 44 px en acciones móviles.                                                         |
| Semántica     | Headings en orden, landmarks, listas reales y botones para acciones.                                      |
| Estados       | Nunca depender solo de color. Incluir texto y, cuando ayude, icono.                                       |
| Formularios   | Label persistente, instrucciones asociadas, error específico y resumen cuando hay varios errores.         |
| Imágenes      | Alt text descriptivo. Planos y renders técnicos incluyen pie o descripción ampliada cuando sea necesaria. |
| Movimiento    | Respeto a reduced motion y ausencia de flashes o desplazamientos obligatorios.                            |
| Zoom          | La interfaz funciona a 200 por ciento sin pérdida de contenido ni scroll horizontal en lectura principal. |

## Privacidad y permisos

- Rol Estudio administrador: configura, edita, publica y gestiona acceso.

- Rol Estudio colaborador: edita según permiso y puede preparar publicaciones; la autorización de publicar se configura por proyecto.

- Rol Cliente responsable: comenta, responde acciones y aprueba cuando se le asigna.

- Rol Cliente consulta: lee y descarga lo autorizado, sin responder en nombre del responsable.

- Las acciones sensibles registran actor, fecha y objeto. El historial no debe exponer notas internas al cliente.

## Gobierno del sistema

| **Activo**       | **Responsable**      | **Criterio de cambio**                                                    |
|------------------|----------------------|---------------------------------------------------------------------------|
| Tokens           | Diseño y desarrollo  | Cambian de forma centralizada y con revisión visual de ambas superficies. |
| Componentes      | Diseño               | Un nuevo componente solo se crea si no existe una variante válida.        |
| Estados y modelo | Producto             | Cualquier cambio documenta efecto en progreso, permisos y portal.         |
| Microcopy        | Producto y contenido | Se actualiza en el glosario antes de propagarse.                          |
| Accesibilidad    | Diseño y desarrollo  | Forma parte de la definición de terminado, no de una revisión posterior.  |

## Convenciones para Figma y código

**Página Figma** 00 Foundations, 01 Components, 02 Patterns, 03 Client Portal, 04 Admin Workspace, 05 Archive.

**Nombre de componente** Familia/Componente/Variante, por ejemplo Actions/Button/Primary.

**Props mínimas** state, size, icon, label, permission y visibility solo cuando correspondan.

**Variables** color, type, space, radius, border, shadow, motion y breakpoint. Evitar valores locales sin token.

**Código** usar el mismo nombre conceptual del componente y mapear variantes a propiedades explícitas.

**Documentación** cada componente registra propósito, anatomía, variantes, comportamiento, contenido, accesibilidad y ejemplos de uso incorrecto.

**PARTE 06**

# Paquete mínimo para comenzar el diseño

El primer ciclo debe validar el lenguaje completo con pocas pantallas conectadas. No hace falta diseñar todo el sistema para comprobar la estructura, pero sí representar sus estados esenciales.

## Pantallas iniciales

| **Orden** | **Pantalla**                     | **Objetivo**                                                            |
|-----------|----------------------------------|-------------------------------------------------------------------------|
| 01        | Admin Crear proyecto             | Definir ADN, alcance, plazo, disciplinas, orden y siguiente acción.     |
| 02        | Admin Workspace activo           | Editar una necesidad con tareas, entregable, visibilidad y dependencia. |
| 03        | Admin Revisión de publicación    | Separar cambios publicados de la comunicación posterior.                |
| 04        | Cliente Bienvenida 0 por ciento  | Probar que existe contenido útil antes de ejecutar tareas.              |
| 05        | Cliente Proyecto activo          | Validar portada, Ahora, progreso y Project Story.                       |
| 06        | Cliente Acción requerida         | Responder una aprobación o selección dentro del contexto.               |
| 07        | Cliente Entregable y comentarios | Revisar un archivo, comentar y conservar la decisión.                   |
| 08        | Estados mobile                   | Comprobar navegación, drawers, carga y acciones en una columna.         |

## Componentes que deben existir primero

- Portal Header y Admin Header

- Project Cover y Progress Summary

- Need Chapter, Stage Divider y Task Row

- Story Entry, Media Figure y Deliverable Row

- Client Action para aprobar, seleccionar y subir documentación

- Comment Thread y Version History

- Button, campos, selector de estado, uploader y controles de visibilidad

- Drawer, modal de publicación, toast y estados vacíos, carga y error

## Datos de prueba necesarios

Construir un proyecto de prueba con las cuatro disciplinas de Bojana y al menos dos necesidades. Debe incluir una tarea interna, una tarea visible, un entregable con dos versiones, una acción del cliente que bloquee el paso siguiente, un comentario resuelto, un cambio sin publicar y una publicación ya comunicada. Los textos pueden ser ficticios, pero la estructura debe seguir el modelo real.

## Criterios de validación

- Una persona cliente identifica en menos de diez segundos cuál es el estado actual y si necesita hacer algo.

- Una persona del estudio crea o actualiza una tarea sin cambiar de módulo.

- La persona que publica puede revisar exactamente qué información nueva verá el cliente.

- El portal sigue siendo comprensible con 0 por ciento, con una acción bloqueante y con el proyecto completo.

- La experiencia funciona con teclado, a 200 por ciento de zoom y en un viewport mobile.

- Los entregables y comentarios siempre conservan el contexto de la necesidad o tarea.

- Ningún color es indispensable para comprender un estado.

## Definición de terminado para una pantalla

| **Revisión**  | **Debe estar resuelta**                                                    |
|---------------|----------------------------------------------------------------------------|
| Modelo        | Todos los elementos pertenecen a una entidad y usan estados canónicos.     |
| Jerarquía     | Título, acción primaria, estado y contenido principal son inequívocos.     |
| Responsive    | Desktop, tablet y mobile conservan orden y funciones.                      |
| Estados       | Vacío, carga, error, sin permiso, disabled y éxito cuando correspondan.    |
| Contenido     | Labels, ayuda, error y confirmación siguen el glosario.                    |
| Accesibilidad | Contraste, teclado, foco, semántica, labels y zoom pasan revisión.         |
| Publicación   | Visibilidad, versión y efecto de publicar están definidos.                 |
| Analítica     | Solo eventos necesarios para evaluar comprensión y finalización de flujos. |

## Orden recomendado de trabajo

> 1\. Cerrar el modelo de datos y los estados con producto.
>
> 2\. Crear foundations y componentes base en Figma.
>
> 3\. Diseñar las ocho pantallas iniciales con contenido realista.
>
> 4\. Prototipar creación, publicación, bienvenida y acción del cliente.
>
> 5\. Validar con una persona del estudio y una persona cliente.
>
> 6\. Ajustar componentes antes de ampliar el resto del portal.
>
> 7\. Implementar por patrones completos y documentar cualquier excepción.

## Principio de cierre

Cada nueva pantalla debe ayudar al estudio a acompañar el proyecto y al cliente a entender qué ocurrió, qué está pasando y qué necesita suceder después. Si una decisión no mejora esa lectura, no pertenece al portal.
