// ============================================================
//  CONTROLADOR: peliculas.controller.js
//  Recibe las peticiones HTTP, valida los datos y responde
//  en formato JSON. Es el puente entre las rutas y el modelo.
// ============================================================

const Pelicula = require("../models/pelicula.model");

// Valida los datos que llegan del formulario.
// Devuelve un texto con el error, o null si todo está correcto.
function validarPelicula(datos) {
    if (!datos.titulo || datos.titulo.trim() === "") {
        return "El título es obligatorio.";
    }
    if (!datos.genero || datos.genero.trim() === "") {
        return "El género es obligatorio.";
    }
    if (!datos.anio || datos.anio < 1900 || datos.anio > 2100) {
        return "El año debe estar entre 1900 y 2100.";
    }
    if (datos.duracion === undefined || datos.duracion <= 0) {
        return "La duración debe ser mayor a 0 minutos.";
    }
    if (
        datos.calificacion === undefined ||
        datos.calificacion < 0 ||
        datos.calificacion > 10
    ) {
        return "La calificación debe estar entre 0 y 10.";
    }
    if (datos.precioCompra === undefined || datos.precioCompra < 0) {
        return "El precio de compra no puede ser negativo.";
    }
    if (datos.precioRenta === undefined || datos.precioRenta < 0) {
        return "El precio de renta no puede ser negativo.";
    }
    return null;
}

// Convierte los datos del body a los tipos correctos (números, booleanos).
function normalizar(body) {
    return {
        titulo: body.titulo,
        genero: body.genero,
        anio: Number(body.anio),
        duracion: Number(body.duracion),
        clasificacion: body.clasificacion || "Sin clasificar",
        calificacion: Number(body.calificacion),
        precioCompra: Number(body.precioCompra),
        precioRenta: Number(body.precioRenta),
        disponibleStreaming: body.disponibleStreaming === true ||
            body.disponibleStreaming === "true",
        descripcion: body.descripcion || "",
        imagen: body.imagen || ""
    };
}

// GET /peliculas  -> lista todas las películas.
function obtenerPeliculas(req, res) {
    res.json(Pelicula.findAll());
}

// GET /peliculas/estadisticas -> resumen para el dashboard.
// (Se define antes que /:id para que Express no lo confunda con un id.)
function obtenerEstadisticas(req, res) {
    const peliculas = Pelicula.findAll();
    const total = peliculas.length;

    // Conteo por género
    const porGenero = {};
    peliculas.forEach(function (p) {
        porGenero[p.genero] = (porGenero[p.genero] || 0) + 1;
    });

    // Promedio de calificación
    const sumaCalif = peliculas.reduce(function (acc, p) {
        return acc + p.calificacion;
    }, 0);
    const promedioCalificacion =
        total > 0 ? Number((sumaCalif / total).toFixed(1)) : 0;

    // Valor total del catálogo (suma de precios de compra)
    const valorCatalogo = peliculas.reduce(function (acc, p) {
        return acc + p.precioCompra;
    }, 0);

    // Disponibles en streaming
    const enStreaming = peliculas.filter(function (p) {
        return p.disponibleStreaming;
    }).length;

    // Película mejor calificada
    let mejorPelicula = null;
    peliculas.forEach(function (p) {
        if (!mejorPelicula || p.calificacion > mejorPelicula.calificacion) {
            mejorPelicula = p;
        }
    });

    res.json({
        total: total,
        porGenero: porGenero,
        promedioCalificacion: promedioCalificacion,
        valorCatalogo: valorCatalogo,
        enStreaming: enStreaming,
        mejorPelicula: mejorPelicula
            ? { titulo: mejorPelicula.titulo, calificacion: mejorPelicula.calificacion }
            : null
    });
}

// GET /peliculas/:id -> una película por id.
function obtenerPelicula(req, res) {
    const id = Number(req.params.id);
    const pelicula = Pelicula.findById(id);

    if (!pelicula) {
        return res.status(404).json({ mensaje: "Película no encontrada." });
    }

    res.json(pelicula);
}

// POST /peliculas -> registra una nueva película.
function crearPelicula(req, res) {
    const datos = normalizar(req.body);

    const error = validarPelicula(datos);
    if (error) {
        return res.status(400).json({ mensaje: error });
    }

    const creada = Pelicula.create(datos);
    res.status(201).json({
        mensaje: "Película registrada correctamente.",
        pelicula: creada
    });
}

// PUT /peliculas/:id -> actualiza una película existente.
function actualizarPelicula(req, res) {
    const id = Number(req.params.id);
    const datos = normalizar(req.body);

    const error = validarPelicula(datos);
    if (error) {
        return res.status(400).json({ mensaje: error });
    }

    const actualizada = Pelicula.actualizar(id, datos);
    if (!actualizada) {
        return res.status(404).json({ mensaje: "Película no encontrada." });
    }

    res.json({
        mensaje: "Película actualizada correctamente.",
        pelicula: actualizada
    });
}

// DELETE /peliculas/:id -> elimina una película.
function eliminarPelicula(req, res) {
    const id = Number(req.params.id);
    const eliminada = Pelicula.eliminar(id);

    if (!eliminada) {
        return res.status(404).json({ mensaje: "Película no encontrada." });
    }

    res.json({ mensaje: "Película eliminada correctamente." });
}

module.exports = {
    obtenerPeliculas,
    obtenerEstadisticas,
    obtenerPelicula,
    crearPelicula,
    actualizarPelicula,
    eliminarPelicula
};
