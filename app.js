// ============================================================
//  Crxder Cinemas - Servidor principal (app.js)
//  Proyecto Final - Desarrollo de Aplicaciones Web
//
//  Tecnologías: Node.js + Express
//  Función: expone una API REST de películas e sirve el frontend.
// ============================================================

const express = require("express");
const path = require("path");

const app = express();

// Permite recibir datos en formato JSON desde el frontend.
app.use(express.json());

// Sirve los archivos estáticos del frontend (HTML, CSS, JS).
app.use(express.static(path.join(__dirname, "public")));

// Ruta de inicio de sesión (POST /login).
const authRoutes = require("./routes/auth.routes");
app.use("/", authRoutes);

// Rutas de la API de películas.
const peliculasRoutes = require("./routes/peliculas.routes");
app.use("/peliculas", peliculasRoutes);

// Puerto del servidor.
const PORT = 4000;

app.listen(PORT, function () {
    console.log("============================================");
    console.log("  Crxder Cinemas en ejecución");
    console.log("  Abre tu navegador en: http://localhost:" + PORT);
    console.log("============================================");
});
