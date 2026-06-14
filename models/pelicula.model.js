// ============================================================
//  MODELO: pelicula.model.js
//  Responsable de LEER y ESCRIBIR las películas en el archivo
//  data/peliculas.json (persistencia de datos).
// ============================================================

const fs = require("fs");
const path = require("path");

const rutaArchivo = path.join(__dirname, "../data/peliculas.json");

// Lee el archivo JSON y lo convierte en un arreglo de objetos.
function leerPeliculas() {
    const datos = fs.readFileSync(rutaArchivo, "utf8");
    return JSON.parse(datos);
}

// Guarda el arreglo de películas en el archivo JSON (con formato legible).
function guardarPeliculas(peliculas) {
    fs.writeFileSync(rutaArchivo, JSON.stringify(peliculas, null, 2));
}

// Devuelve todas las películas.
function findAll() {
    return leerPeliculas();
}

// Busca una película por su id.
function findById(id) {
    const peliculas = leerPeliculas();
    return peliculas.find(function (p) {
        return p.id === id;
    });
}

// Crea una nueva película. Calcula el id como (id máximo + 1).
function create(datos) {
    const peliculas = leerPeliculas();

    const nuevoId =
        peliculas.length > 0
            ? Math.max(...peliculas.map(function (p) { return p.id; })) + 1
            : 1;

    const nuevaPelicula = {
        id: nuevoId,
        titulo: datos.titulo,
        genero: datos.genero,
        anio: datos.anio,
        duracion: datos.duracion,
        clasificacion: datos.clasificacion,
        calificacion: datos.calificacion,
        precioCompra: datos.precioCompra,
        precioRenta: datos.precioRenta,
        disponibleStreaming: datos.disponibleStreaming,
        descripcion: datos.descripcion,
        imagen: datos.imagen || ""
    };

    peliculas.push(nuevaPelicula);
    guardarPeliculas(peliculas);

    return nuevaPelicula;
}

// Actualiza TODOS los datos de una película existente.
function actualizar(id, datos) {
    const peliculas = leerPeliculas();

    const pelicula = peliculas.find(function (p) {
        return p.id === id;
    });

    if (!pelicula) {
        return null;
    }

    pelicula.titulo = datos.titulo ?? pelicula.titulo;
    pelicula.genero = datos.genero ?? pelicula.genero;
    pelicula.anio = datos.anio ?? pelicula.anio;
    pelicula.duracion = datos.duracion ?? pelicula.duracion;
    pelicula.clasificacion = datos.clasificacion ?? pelicula.clasificacion;
    pelicula.calificacion = datos.calificacion ?? pelicula.calificacion;
    pelicula.precioCompra = datos.precioCompra ?? pelicula.precioCompra;
    pelicula.precioRenta = datos.precioRenta ?? pelicula.precioRenta;
    pelicula.disponibleStreaming =
        datos.disponibleStreaming ?? pelicula.disponibleStreaming;
    pelicula.descripcion = datos.descripcion ?? pelicula.descripcion;
    pelicula.imagen = datos.imagen ?? pelicula.imagen;

    guardarPeliculas(peliculas);

    return pelicula;
}

// Elimina una película por su id.
function eliminar(id) {
    const peliculas = leerPeliculas();
    const restantes = peliculas.filter(function (p) {
        return p.id !== id;
    });

    if (restantes.length === peliculas.length) {
        return false; // no se encontró nada que borrar
    }

    guardarPeliculas(restantes);
    return true;
}

module.exports = {
    findAll,
    findById,
    create,
    actualizar,
    eliminar
};
