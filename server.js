const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || "https://api-m.paypal.com";

const PRODUCTS = {
  peluquerias: { name: "Pack 50 plantillas Instagram para peluquerías", price: "19.00", file: "productos/pack-peluquerias.pdf" },
  excel: { name: "Excel Control de Gastos y Ahorro 5.000 €", price: "12.00", file: "productos/control-gastos.xlsx" },
  oposiciones: { name: "Notion para organizar unas oposiciones", price: "15.00", file: "productos/notion-oposiciones.zip" },
  inmobiliarios: { name: "Kit Canva para inmobiliarios", price: "24.00", file: "productos/kit-inmobiliarios.pdf" }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function paypalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("Faltan PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en las variables de entorno.");
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const r = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!r.ok) throw new Error(`PayPal OAuth error ${r.status}`);
  return (await r.json()).access_token;
}

app.get("/api/config", (req, res) => {
  res.json({ clientId: PAYPAL_CLIENT_ID || "", currency: "EUR" });
});

app.post("/api/orders", async (req, res) => {
  try {
    const product = PRODUCTS[req.body.productId];
    if (!product) return res.status(400).json({ error: "Producto no válido." });

    const token = await paypalAccessToken();
    const r = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": crypto.randomUUID()
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          description: product.name,
          amount: { currency_code: "EUR", value: product.price },
          custom_id: req.body.productId
        }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });
    res.json({ id: data.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo crear el pedido." });
  }
});

app.post("/api/orders/:orderId/capture", async (req, res) => {
  try {
    const token = await paypalAccessToken();
    const r = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(req.params.orderId)}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    if (data.status !== "COMPLETED") {
      return res.status(400).json({ error: "El pago no quedó completado.", paypal: data });
    }

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    const productId = data.purchase_units?.[0]?.custom_id;
    const product = PRODUCTS[productId];

    if (!product || !capture || capture.status !== "COMPLETED") {
      return res.status(400).json({ error: "No se pudo validar el producto o el pago." });
    }

    // En producción: sustituir por almacenamiento privado + enlace firmado/expirable.
    const downloadUrl = `/downloads/${encodeURIComponent(product.file)}`;
    res.json({ success: true, product: product.name, downloadUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo capturar el pago." });
  }
});

app.get("/downloads/*", (req, res) => {
  const relative = req.params[0];
  const full = path.resolve(__dirname, "downloads", relative);
  const root = path.resolve(__dirname, "downloads");
  if (!full.startsWith(root + path.sep)) return res.status(400).send("Ruta no válida.");
  if (!fsExists(full)) return res.status(404).send("Archivo no encontrado.");
  res.download(full);
});

function fsExists(p) {
  try { require("fs").accessSync(p); return true; } catch { return false; }
}

app.listen(PORT, () => console.log(`Tienda lista en http://localhost:${PORT}`));
