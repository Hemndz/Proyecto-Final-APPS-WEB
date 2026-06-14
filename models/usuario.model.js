// ============================================================
//  MODELO: usuario.model.js
//  Lee los usuarios de data/usuarios.json y valida el acceso.
// ============================================================

const fs = require("fs");
const path = require("path");

const rutaArchivo = path.join(__dirname, "../data/usuarios.json");

function leerUsuarios() {
    const datos = fs.readFileSync(rutaArchivo, "utf8");
    return JSON.parse(datos);
}

// Devuelve el usuario si las credenciales son correctas, o null si no.
function validar(usuario, contrasena) {
    const usuarios = leerUsuarios();
    return usuarios.find(function (u) {
        return u.usuario === usuario && u.contrasena === contrasena;
    }) || null;
}

module.exports = { validar };
