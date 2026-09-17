# Digitalia — Tienda PayPal

## Qué incluye
- Tienda web responsive.
- Carrito con localStorage.
- Botón PayPal.
- Backend Node/Express.
- Creación y captura de pedidos PayPal en servidor.
- Catálogo con precios definidos en el servidor.
- Entrega posterior al pago mediante endpoint de descarga.

## Importante antes de vender
1. Instala Node.js.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env`.
4. Añade tu `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.
5. Ejecuta `npm start`.
6. Abre `http://localhost:3000`.

## Producción
- Usa credenciales LIVE de PayPal.
- Guarda secretos como variables de entorno del hosting, nunca en Git ni en el navegador.
- Para una tienda real, mueve los archivos de `downloads/` a almacenamiento privado y usa enlaces firmados/expirables después de verificar el pago.
- Configura HTTPS y un dominio propio.
- Prueba primero en el sandbox de PayPal.

## Productos
Los precios y los identificadores se definen en `server.js`, por lo que el cliente no puede cambiar el importe enviado al servidor.

## Archivos
Coloca tus archivos finales en:
downloads/productos/
con estos nombres:
- pack-peluquerias.pdf
- control-gastos.xlsx
- notion-oposiciones.zip
- kit-inmobiliarios.pdf
