# Lo Cosito

Aplicación interna para gestionar costos, recetas, producción, pedidos y ventas de un emprendimiento de comida vegana y vegetariana. La base proviene de [Dulce Gestión](https://github.com/Wanheda29/dulce-gestion/tree/39c4b9de901fd7e3b834d41e16c242e267c616ad).

## Desarrollo local

Requiere Node.js 20 o posterior.

```sh
npm run serve
```

Abrí [http://localhost:4173](http://localhost:4173). Ejecutá `npm test` para correr las pruebas.

La aplicación usa el [proyecto Lo Cosito de Supabase](https://supabase.com/dashboard/project/kwnljzxsodsmnkgypzkp). Cada integrante ingresa con su correo y contraseña y el equipo comparte los datos del negocio. Desde **Datos y respaldos** se pueden exportar y restaurar respaldos JSON.

## Demo pública

La [demo de GitHub Pages](https://wanheda29.github.io/lo-cosito/) guarda los datos de prueba en el navegador y prescinde de las cuentas de Supabase. El flujo de GitHub Actions publica la demo con cada cambio en `main`.

## Habilitar el acceso del equipo en Supabase

1. Creá una cuenta por integrante en **Authentication → Users**. Completá `team_emails` en una copia de `supabase/team.sql` con los correos de esas cuentas y ejecutala en **SQL Editor**. El script vincula las cuentas al mismo negocio y admite ejecuciones posteriores para sumar integrantes.
2. Ingresá desde dos perfiles de navegador con distintas cuentas. Guardá un registro de prueba con una y, en la otra, elegí **Cuenta → Actualizar desde la nube** para verificar que ambas vean el mismo registro. Si dos dispositivos guardan sobre la misma revisión, el segundo cambio queda como borrador en su dispositivo para evitar sobrescribir los datos compartidos.

Para configurar otro entorno, aplicá `supabase/schema.sql` una vez y usá `supabase/verify.sql` para verificar el esquema. Actualizá la URL y la clave pública `sb_publishable_...` en `cloud-config.js`.
