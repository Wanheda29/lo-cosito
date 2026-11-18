# Lo Cosito

Aplicación interna para gestionar costos, recetas, producción, pedidos y ventas de un emprendimiento de comida vegana y vegetariana. La base proviene de [Dulce Gestión](https://github.com/Wanheda29/dulce-gestion/tree/39c4b9de901fd7e3b834d41e16c242e267c616ad).

## Desarrollo local

Requiere Node.js 20 o posterior.

```sh
npm run serve
```

Abrí [http://localhost:4173](http://localhost:4173). Ejecutá `npm test` para correr las pruebas.

La aplicación empieza con datos vacíos y guarda los registros en el navegador. Desde **Datos y respaldos** se pueden exportar y restaurar respaldos JSON de Lo Cosito. La configuración para activar el inicio de sesión y la sincronización con un proyecto propio de Supabase está en `cloud-config.js`. El esquema SQL reutilizable está en `supabase/schema.sql`.
