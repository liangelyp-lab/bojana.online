# Bojana Online

Portal editorial de proyectos y workspace del estudio. El contrato de producto y diseño está en [docs/BOJANA_PORTAL_ADN.md](docs/BOJANA_PORTAL_ADN.md); la trazabilidad de la auditoría está en [docs/UI_RESOLUTION_2026-10-03.md](docs/UI_RESOLUTION_2026-10-03.md).

## Desarrollo y validación

Usar Node.js 24 y ejecutar:

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

En entornos que no permiten enumerar interfaces de red, el servidor local puede abrirse con `npx vite --host 127.0.0.1 --port 3000`.

## Límite de la demostración

Los proyectos y archivos se guardan en localStorage. No hay autenticación, autorización del lado servidor, persistencia entre dispositivos ni envío de email. La UI identifica estas limitaciones; las entradas de demostración no deben considerarse un control de acceso.

Editar un borrador no modifica el portal. Publicar crea una copia visible con fecha, versión y autor; los avisos son una acción posterior independiente. Los proyectos anteriores deben revisarse y publicarse antes de consultar su portal.

El código anterior se conserva en [archive/ui-v1](archive/ui-v1), fuera de la aplicación activa. Los datos de ejemplo y sus recursos permanecen disponibles para vincularlos explícitamente con el paso que les corresponda.
