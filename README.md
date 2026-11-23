# Lo Cositos

Aplicación interna para gestionar costos, recetas, producción, pedidos y ventas de un emprendimiento de comida vegana y vegetariana. La base proviene de [Dulce Gestión](https://github.com/Wanheda29/dulce-gestion/tree/39c4b9de901fd7e3b834d41e16c242e267c616ad).

## Desarrollo local

Requiere Node.js 20 o posterior.

```sh
npm run serve
```

Abrí [http://localhost:4173](http://localhost:4173). Ejecutá `npm test` para correr las pruebas.

La aplicación usa el [proyecto Lo Cositos de Supabase](https://supabase.com/dashboard/project/kwnljzxsodsmnkgypzkp). Cada integrante ingresa con su correo y contraseña y el equipo comparte los datos del negocio. Desde **Datos y respaldos** se pueden exportar y restaurar respaldos JSON.

## Publicación en GitHub Pages

La [web de Lo Cositos](https://wanheda29.github.io/lo-cosito/) requiere una cuenta de Supabase vinculada al negocio. GitHub Pages sirve los archivos estáticos. El navegador se conecta directamente a Supabase por HTTPS para iniciar sesión y sincronizar los datos. GitHub Actions publica la web con cada cambio en `main`.

Los registros que se hayan cargado en la antigua demo siguen en el navegador donde se ingresaron. La versión compartida usa los datos de Supabase.

## Habilitar el acceso del equipo en Supabase

1. Creá una cuenta por integrante en **Authentication → Users**. Completá `team_emails` en una copia de `supabase/team.sql` con los correos de esas cuentas y ejecutala en **SQL Editor**. El script vincula las cuentas al mismo negocio y admite ejecuciones posteriores para sumar integrantes.
2. Ingresá desde dos perfiles de navegador con distintas cuentas. Guardá un registro de prueba con una y, en la otra, elegí **Cuenta → Actualizar desde la nube** para verificar que ambas vean el mismo registro. Si dos dispositivos guardan sobre la misma revisión, el segundo cambio queda como borrador en su dispositivo para evitar sobrescribir los datos compartidos.

Para configurar otro entorno, aplicá `supabase/schema.sql` una vez y usá `supabase/verify.sql` para verificar el esquema. Actualizá la URL y la clave pública `sb_publishable_...` en `cloud-config.js`.

## Recetas y productos

Registrá el rendimiento y los ingredientes de cada receta. En **Producción**, elegí la receta y la cantidad de tandas. En **Productos**, vinculá la receta y definí cuántas unidades lleva cada presentación y su precio. Por ejemplo, una receta puede rendir 24 milanesas y una bandeja llevar 10. En **Ventas**, una unidad de ese producto equivale a una bandeja.

Los registros anteriores conservan el producto original y crean una receta vinculada. Para una receta anterior con rendimiento de al menos una unidad, la presentación inicial conserva una unidad de receta por producto. El rendimiento anterior se mantiene para producir por tandas, y las cantidades y costos de ventas ya registradas se conservan.

En **Recetas**, el saldo suma las producciones vigentes y descuenta las ventas directas y los pedidos que ya se registraron como venta. Una bandeja x10 descuenta 10 unidades por bandeja. El sistema conserva las cantidades descontadas aunque después se edite la presentación. Si las ventas superan lo producido, la tarjeta muestra cuántas unidades faltan y permite registrar la producción más tarde. Para movimientos anteriores a este cambio, el saldo se calcula con las presentaciones y vínculos que se encuentren en el catálogo al actualizarse.
