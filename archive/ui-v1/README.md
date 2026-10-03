# Archivo de interfaz anterior

Estos 32 componentes se conservaron tras comprobar que ningún import desde `src/main.tsx` llega a ellos. No forman parte del build ni del chequeo TypeScript actual. Se mantienen para consultar y recuperar trabajo anterior; no deben volver a importarse sin adaptar su comportamiento al sistema común.

La estructura relativa histórica se conserva bajo `src/components`. Los imports de este archivo histórico requieren las antiguas rutas de servicios y tipos: no es una aplicación independiente.

La UI activa está en `src/components/ui/System.tsx`, `studio/Workspace.tsx`, `studio/Screens.tsx`, `studio/ResourceEditor.tsx`, `client/Story.tsx` y `client/Resources.tsx`. Los proyectos guardados, documentos, revisiones, imágenes, materiales y decisiones no se borraron. La incorporación de recursos antiguos a tareas ocurre mediante selección explícita del estudio.
