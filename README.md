# Lo Cosito

Aplicación interna para gestionar costos, recetas, producción, pedidos y ventas de un emprendimiento de comida vegana y vegetariana. La base proviene de [Dulce Gestión](https://github.com/Wanheda29/dulce-gestion/tree/39c4b9de901fd7e3b834d41e16c242e267c616ad).

## Desarrollo local

Requiere Node.js 20 o posterior.

```sh
npm run serve
```

Abrí [http://localhost:4173](http://localhost:4173). Ejecutá `npm test` para correr las pruebas.

La configuración inicial permite probar con datos vacíos guardados en este navegador. Al configurar Supabase, cada integrante ingresa con su correo y contraseña y el equipo comparte los datos de Lo Cosito. Desde **Datos y respaldos** se pueden exportar y restaurar respaldos JSON.

## Habilitar el acceso del equipo en Supabase

1. En un proyecto propio de Lo Cosito, ejecutá `supabase/schema.sql` una vez en **SQL Editor**. Después ejecutá `supabase/verify.sql` para verificar el esquema.
2. Creá una cuenta por integrante en **Authentication → Users**. Completá `team_emails` en una copia de `supabase/team.sql` con los correos de esas cuentas y ejecutala en **SQL Editor**. El script vincula las cuentas al mismo negocio y admite ejecuciones posteriores para sumar integrantes.
3. Copiá la URL del proyecto y su clave pública `sb_publishable_...` del cuadro **Connect** a `cloud-config.js`. Cambiá `enabled` a `true`.
4. Ingresá desde dos perfiles de navegador con distintas cuentas. Guardá un registro de prueba con una y, en la otra, elegí **Cuenta → Actualizar desde la nube** para verificar que ambas vean el mismo registro. Si dos dispositivos guardan sobre la misma revisión, el segundo cambio queda como borrador en su dispositivo para evitar sobrescribir los datos compartidos.
