# Revisión comparativa del portal — 20 octubre 2026

## Dictamen

El portal tiene una base funcional avanzada. Todavía no hay evidencia suficiente para declararlo listo para uso general con clientes. Las correcciones locales deben consolidarse, cerrar los hallazgos de permisos y consistencia, y pasar una prueba integral en un entorno con backend real.

Alcance: revisión del código actual, resultados de chats anteriores, documentos del repositorio, build, TypeScript, pruebas existentes y navegación local de listado, proyecto y vista de cliente. No se modificó código de aplicación ni se ejecutaron acciones de publicación, correo, invitación o cambios en producción. No se validaron la base remota, sus políticas activas ni el despliegue actual. La preview usa datos de ejemplo; no demuestra persistencia real.

## Comparación con revisiones anteriores

Fuentes: chats «Revisar proyecto completo», «Revisar privacidad del portal», «Para migrar» y «Review project status»; preview-audit.md y component-coverage.md.

| Tema anterior | Estado comprobado ahora | Cierre pendiente |
|---|---|---|
| Enlace público enviaba módulos internos completos | toClientProject filtra tareas, archivos y actualizaciones; arrays legacy vacíos | Probar exhaustivamente exclusión de contenido interno y visibilidad de acciones |
| Respuestas de cliente sin guardado permitido | Existe /api/portal/respond y está integrado; hay pruebas de cambios y aprobación | Roles, concurrencia y prueba real como cliente/token |
| UI llamaba ruta de integrantes inexistente | Usa /api/admin/team-users; existe también rewrite de compatibilidad | Prueba real de acciones administrativas |
| No había pruebas | 13 pruebas pasan | Casos negativos de tokens, roles, privacidad y flujos completos |
| Errores TypeScript amplios | Queda un error en App.tsx:2688 | Resolver comparación redundante true/false |
| Componentes duplicados o faltantes | Existe base de Button, campos, Card, Modal, tabs y Storybook | QA manual de teclado, móvil y contraste; actualizar cobertura histórica |
| Guardado local sin coordinación | Escrituras ordenadas por proyecto y publicación espera guardado; falla bloquea compartir | Reintento persistente y conflictos entre dispositivos/usuarios |
| Privacidad dependiente de migración SQL | privacy-hardening.sql existe | Confirmar ejecución y políticas efectivas en Supabase |
| Entregas finales de fase | Código parcial con cierres y destacados | Proyección pública y definición final de galería/presentación/interactivo |

## Hallazgos prioritarios

### 1. Permisos de respuesta del cliente — alto

api/portal/respond.ts, canRespond: después de owner/admin, acepta cualquier fila de project_members sin filtrar role. Un integrante asignado puede usar la ruta de respuesta y generar actividad atribuida a «Cliente». Debe definirse qué roles pueden responder como cliente y probar los demás como denegados. El endpoint usa clave de servicio, de modo que su autorización es decisiva.

También revisar applyResponse: deliverable no exige task.visibleCliente ni visibilidad de la necesidad; client_action y task_update no verifican need.visibleCliente. La respuesta debe estar restringida al mismo conjunto visible que publica el portal.

### 2. Cierres de fase ausentes del enlace público — alto funcional

App.tsx calcula phaseClosures a partir de need.cierrePublicado y usa cierreDestacado/cierreFecha. api/portal/direct.ts construye necesidades sin estos campos. Resultado esperado por lectura de código: un cierre puede verse al previsualizar el proyecto completo y desaparecer al cargarlo por enlace público. Añadir proyección explícita y prueba de equivalencia antes de dar por terminada esta función.

### 3. Archivos publicados en Drive — alto si se exige acceso revocable

api/storage/[...path].ts crea permisos {type: anyone, role: reader}. Revocar el enlace del portal no revoca esas URLs de Drive. Es el pendiente señalado por la revisión de privacidad anterior. Definir si se acepta esta modalidad; si los documentos deben ser privados, usar entrega autenticada y revocable.

### 4. Posible pérdida de cambios simultáneos — alto para uso con varios actores

respond.ts lee el documento JSON completo y lo reemplaza mediante PATCH sin condición de versión. El guardado del estudio también escribe el proyecto completo. La cola del navegador ordena escrituras en esa sesión, pero no coordina otra sesión ni una respuesta del cliente. Dos operaciones concurrentes pueden sobrescribirse. Cerrar con control de versión/transacción o actualizaciones atómicas y una prueba concurrente.

### 5. Validación técnica y entrega — pendiente

- tsc --noEmit falla en App.tsx:2688 por comparación true/false redundante.
- tsconfig incluye src y vite.config.ts; este chequeo no cubre api.
- No se encontró workflow en .github; package.json no tiene scripts test/typecheck.
- Había 18 archivos modificados antes de esta revisión. Este estado local no equivale a una versión desplegada y probada.

## Funcionalidad incompleta o no validada

- Carga de archivos por cliente: App.tsx rechaza explícitamente la selección con «La carga de archivos desde el portal todavía no está disponible». Implementar carga segura o retirar esa promesa del flujo inicial.
- Clientes: getAllClients/saveAllClients siguen usando localStorage como catálogo. Confirmar comportamiento esperado entre navegadores y equipos.
- Sincronización: hay estados de guardado y bloqueo de compartir, pero no cola durable/reintento automático ni resolución de conflictos.
- Datos históricos: siguen existiendo fechas legibles antiguas; las fechas nuevas tienen tratamiento mejorado. En la demo aparecieron hitos pasados como próximos: verificar vencimientos con fechas reales.
- QA visual: recorrido limitado a escritorio. No se certificaron móvil, todos los modales, teclado, lectores de pantalla ni contraste.
- Documentación: component-coverage.md describe campos/cards/modales como faltantes pese a que existen; preview-audit.md corresponde al 6 de octubre. Mantenerlos como históricos, no como estado vigente.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| pnpm build | Pasa |
| pnpm build-storybook | Pasa; advertencias de tamaño de chunks y tiempos de plugins |
| node --test tests/project-sync.test.cjs | 13/13 pasan |
| tsc --noEmit | Falla: App.tsx:2688 TS2367 |
| git diff --check | Pasa |
| Preview local | Listado, proyecto y vista cliente cargan y permiten navegación |

Las pruebas existentes cubren permisos de guardado del estudio, orden de guardado, bloqueo de compartir al fallar y algunas respuestas. No sustituyen pruebas contra Supabase/Vercel reales.

## Criterio para estar listos

1. Resolver TypeScript y cerrar permisos de respond, visibilidad y cierres públicos con pruebas.
2. Asegurar que una respuesta y una edición simultáneas no se pierdan.
3. Confirmar migración RLS en Supabase y probar aislamiento entre estudios/proyectos con owner, admin, team y cliente.
4. Definir y aplicar la privacidad de Drive y el alcance de carga por cliente.
5. Consolidar una versión del código y desplegarla a staging con los mismos servicios que producción.
6. Recorrer: acceso → crear proyecto → asignar equipo → editar → publicar → invitar → responder como cliente → verificar persistencia en otra sesión → descargar archivo → revocar enlace → comprobar denegación.
7. Probar errores de red, token vencido/revocado, acceso ajeno, móvil y teclado. Verificar envío/recepción de correo, Lark y Drive.
8. Añadir controles automáticos de build, tipos y pruebas, y documentar respaldo/restauración antes del uso general.

Tras estos cierres, un piloto acotado con un proyecto real permitiría evaluar la operación cotidiana. No asigno un porcentaje de avance: la cantidad de pantallas terminadas no mide los riesgos pendientes.
