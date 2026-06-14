// ============================================================
//  CONTROLADOR: auth.controller.js
//  Valida el inicio de sesión (usuario + contraseña).
// ============================================================

const Usuario = require("../models/usuario.model");

// POST /login
function login(req, res) {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
        return res.status(400).json({ mensaje: "Escribe tu usuario y contraseña." });
    }

    const encontrado = Usuario.validar(usuario, contrasena);

    if (!encontrado) {
        return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
    }

    res.json({ mensaje: "Inicio de sesión correcto.", usuario: encontrado.usuario });
}

module.exports = { login };
