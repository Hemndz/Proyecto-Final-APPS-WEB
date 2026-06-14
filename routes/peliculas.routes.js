// ============================================================
//  RUTAS: peliculas.routes.js
//  Define qué función del controlador atiende cada combinación
//  de método HTTP + ruta.
// ============================================================

const express = require("express");
const router = express.Router();

const controlador = require("../controllers/peliculas.controller");

// IMPORTANTE: la ruta literal "/estadisticas" va ANTES que "/:id"
// para que Express no la interprete como un id.
router.get("/estadisticas", controlador.obtenerEstadisticas);

router.get("/", controlador.obtenerPeliculas);          // Consultar todas
router.get("/:id", controlador.obtenerPelicula);        // Consultar una
router.post("/", controlador.crearPelicula);            // Registrar
router.put("/:id", controlador.actualizarPelicula);     // Actualizar
router.delete("/:id", controlador.eliminarPelicula);    // Eliminar

module.exports = router;
