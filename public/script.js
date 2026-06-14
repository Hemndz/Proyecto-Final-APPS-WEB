/* ============================================================
   Crxder Cinemas — Lógica del frontend (script.js)
   - Consume la API REST de /peliculas (GET, POST, PUT, DELETE)
   - Maneja navegación, catálogo, modal, CRUD, búsqueda/filtros y stats
   ============================================================ */

// ---------------- Estado ----------------
let peliculas = [];        // copia local de las películas (cache)
let idEnEdicion = null;    // id de la película en edición, o null si es registro nuevo

// Géneros sugeridos para el formulario (datalist)
const GENEROS_FIJOS = ["Acción", "Animación", "Ciencia ficción", "Comedia", "Drama", "Suspenso", "Terror"];

// Gradientes (verdes/grises) para pósters que no tienen imagen
const GRADIENTES = [
    "linear-gradient(150deg,#1e4733 0%,#0a1611 100%)",
    "linear-gradient(150deg,#13503a 0%,#0a1f17 100%)",
    "linear-gradient(150deg,#26433a 0%,#0c1714 100%)",
    "linear-gradient(150deg,#2f5d3f 0%,#0e1c14 100%)",
    "linear-gradient(150deg,#1b3a4a 0%,#0a1518 100%)",
    "linear-gradient(150deg,#3a4a2f 0%,#141a0e 100%)",
    "linear-gradient(150deg,#1f5145 0%,#091a16 100%)",
    "linear-gradient(150deg,#384a44 0%,#101715 100%)"
];

// ---------------- Atajos para seleccionar elementos ----------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const vistas = $$(".vista");
const enlacesNav = $$("[data-vista]");

const hero = $("#hero");
const catalogo = $("#catalogo");
const buscador = $("#buscador");
const filtroGenero = $("#filtro-genero");
const filtroTipo = $("#filtro-tipo");
const ordenSelect = $("#orden");

const formPelicula = $("#form-pelicula");
const tituloForm = $("#titulo-form");
const mensajeForm = $("#mensaje-form");
const btnGuardar = $("#btn-guardar");
const btnCancelar = $("#btn-cancelar");
const tablaPeliculas = $("#tabla-peliculas");

const statsTarjetas = $("#stats-tarjetas");
const statsGeneros = $("#stats-generos");

const modal = $("#modal");
const modalContenido = $("#modal-contenido");
const toast = $("#toast");

// ---------------- Navegación entre vistas ----------------
function cambiarVista(nombre) {
    vistas.forEach((v) => v.classList.remove("activa"));
    $("#vista-" + nombre).classList.add("activa");
    enlacesNav.forEach((a) => a.classList.toggle("activo", a.dataset.vista === nombre));

    if (nombre === "estadisticas") renderEstadisticas();
    if (nombre === "administrar") renderAdmin();

    window.scrollTo({ top: 0, behavior: "smooth" });
}
enlacesNav.forEach((a) => a.addEventListener("click", () => cambiarVista(a.dataset.vista)));

// ---------------- Comunicación con la API ----------------
async function api(url, opciones) {
    const resp = await fetch(url, opciones);
    let datos = null;
    try { datos = await resp.json(); } catch (e) { datos = null; }
    if (!resp.ok) {
        const msg = datos && datos.mensaje ? datos.mensaje : "Error en la petición.";
        throw new Error(msg);
    }
    return datos;
}

async function cargarPeliculas() {
    try {
        peliculas = await api("/peliculas");
        poblarFiltroGenero();
        renderHero();
        renderCatalogo();
    } catch (e) {
        catalogo.innerHTML = `<p class="vacio">No se pudieron cargar las películas. ¿El servidor está encendido?</p>`;
    }
}

// ---------------- Utilidades ----------------
function posterEstilo(p) {
    if (p.imagen && p.imagen.trim() !== "") {
        return `background-image:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.7)),url('${p.imagen}');background-size:cover;background-position:center;`;
    }
    return `background:${GRADIENTES[p.id % GRADIENTES.length]};`;
}
function estrellas(calif) { return "★ " + Number(calif).toFixed(1); }
function peliPorId(id) { return peliculas.find((p) => p.id === Number(id)); }

// ---------------- Hero (película destacada) ----------------
function renderHero() {
    if (peliculas.length === 0) {
        hero.style.cssText = `background:${GRADIENTES[0]};min-height:38vh;`;
        hero.innerHTML = `
            <div class="hero-capa"></div>
            <div class="hero-info">
                <span class="hero-etiqueta">Bienvenido a Crxder Cinemas</span>
                <h1 class="hero-titulo">Catálogo vacío</h1>
                <p class="hero-desc">Aún no hay películas. Ve a la pestaña "Administrar" para registrar la primera.</p>
            </div>`;
        return;
    }

    // La destacada es la mejor calificada
    const destacada = peliculas.reduce((a, b) => (b.calificacion > a.calificacion ? b : a), peliculas[0]);

    hero.style.cssText = posterEstilo(destacada);
    hero.innerHTML = `
        <div class="hero-capa"></div>
        <div class="hero-info">
            <span class="hero-etiqueta">★ Destacada de la semana</span>
            <h1 class="hero-titulo">${destacada.titulo}</h1>
            <div class="hero-meta">
                <span class="badge-verde">${estrellas(destacada.calificacion)}</span>
                <span>${destacada.anio}</span>
                <span>${destacada.duracion} min</span>
                <span class="pill">${destacada.genero}</span>
                <span class="pill">${destacada.clasificacion}</span>
            </div>
            <p class="hero-desc">${destacada.descripcion}</p>
            <div class="hero-acciones">
                <button class="btn btn-claro" onclick="ver(${destacada.id})">▶ Ver ahora</button>
                <button class="btn btn-verde" onclick="comprar(${destacada.id})">🛒 Comprar $${destacada.precioCompra}</button>
                <button class="btn btn-borde" onclick="rentar(${destacada.id})">⏱ Rentar $${destacada.precioRenta}</button>
                <button class="btn btn-borde" onclick="abrirDetalle(${destacada.id})">ⓘ Más info</button>
            </div>
        </div>`;
}

// ---------------- Filtros ----------------
function poblarFiltroGenero() {
    const generos = [...new Set(peliculas.map((p) => p.genero))].sort();
    filtroGenero.innerHTML =
        `<option value="">Todos los géneros</option>` +
        generos.map((g) => `<option value="${g}">${g}</option>`).join("");
}

function peliculasFiltradas() {
    const texto = (buscador.value || "").toLowerCase().trim();
    const genero = filtroGenero.value;
    const tipo = filtroTipo.value;

    let lista = peliculas.filter((p) => {
        const coincideTexto =
            !texto || p.titulo.toLowerCase().includes(texto) || p.genero.toLowerCase().includes(texto);
        const coincideGenero = !genero || p.genero === genero;
        const coincideTipo = tipo !== "streaming" || p.disponibleStreaming;
        return coincideTexto && coincideGenero && coincideTipo;
    });

    const orden = ordenSelect.value;
    if (orden === "calif") lista.sort((a, b) => b.calificacion - a.calificacion);
    else if (orden === "anio") lista.sort((a, b) => b.anio - a.anio);
    else if (orden === "precio") lista.sort((a, b) => a.precioCompra - b.precioCompra);
    else if (orden === "titulo") lista.sort((a, b) => a.titulo.localeCompare(b.titulo));

    return lista;
}

function hayFiltrosActivos() {
    return (
        buscador.value.trim() !== "" ||
        filtroGenero.value !== "" ||
        filtroTipo.value !== "" ||
        ordenSelect.value !== ""
    );
}

// ---------------- Catálogo ----------------
function crearTarjeta(p) {
    return `
        <article class="tarjeta" tabindex="0" onclick="abrirDetalle(${p.id})">
            <div class="poster" style="${posterEstilo(p)}">
                <span class="poster-rank">${estrellas(p.calificacion)}</span>
                ${p.disponibleStreaming ? "" : '<span class="poster-no-stream">Sin streaming</span>'}
                <div class="tarjeta-acciones">
                    <button class="mini ver" title="Ver" onclick="event.stopPropagation();ver(${p.id})">▶</button>
                    <button class="mini" title="Comprar" onclick="event.stopPropagation();comprar(${p.id})">🛒</button>
                    <button class="mini" title="Rentar" onclick="event.stopPropagation();rentar(${p.id})">⏱</button>
                    <button class="mini info" title="Detalles" onclick="event.stopPropagation();abrirDetalle(${p.id})">ⓘ</button>
                </div>
                <div class="poster-info">
                    <span class="poster-genero">${p.genero}</span>
                    <h4 class="poster-titulo">${p.titulo}</h4>
                    <span class="poster-sub">${p.anio} · ${p.duracion} min</span>
                </div>
            </div>
        </article>`;
}

function renderCatalogo() {
    // Con búsqueda/filtros/orden -> cuadrícula de resultados
    if (hayFiltrosActivos()) {
        const lista = peliculasFiltradas();
        if (lista.length === 0) {
            catalogo.innerHTML = `<p class="vacio">No se encontraron películas con esos criterios. 🎬</p>`;
            return;
        }
        catalogo.innerHTML = `
            <section class="fila">
                <h3 class="fila-titulo">Resultados (${lista.length})</h3>
                <div class="grid">${lista.map(crearTarjeta).join("")}</div>
            </section>`;
        return;
    }

    // Sin películas registradas
    if (peliculas.length === 0) {
        catalogo.innerHTML = `<p class="vacio">Aún no hay películas en el catálogo. Ve a "Administrar" para registrar la primera. 🎬</p>`;
        return;
    }

    // Sin filtros -> filas por género (estilo Netflix)
    const generos = [...new Set(peliculas.map((p) => p.genero))].sort();
    catalogo.innerHTML = generos
        .map((g) => {
            const items = peliculas.filter((p) => p.genero === g);
            return `
                <section class="fila">
                    <h3 class="fila-titulo">${g}</h3>
                    <div class="fila-wrap">
                        <button class="flecha izq" onclick="desplazar(this,-1)" aria-label="Anterior">‹</button>
                        <div class="fila-scroll">${items.map(crearTarjeta).join("")}</div>
                        <button class="flecha der" onclick="desplazar(this,1)" aria-label="Siguiente">›</button>
                    </div>
                </section>`;
        })
        .join("");
}

function desplazar(btn, dir) {
    const scroll = btn.parentElement.querySelector(".fila-scroll");
    scroll.scrollBy({ left: dir * scroll.clientWidth * 0.85, behavior: "smooth" });
}

// Eventos de búsqueda / filtros / orden
buscador.addEventListener("input", renderCatalogo);
filtroGenero.addEventListener("change", renderCatalogo);
filtroTipo.addEventListener("change", renderCatalogo);
ordenSelect.addEventListener("change", renderCatalogo);

// ---------------- Modal de detalle ----------------
function abrirDetalle(id) {
    const p = peliPorId(id);
    if (!p) return;

    modalContenido.innerHTML = `
        <button class="modal-cerrar" onclick="cerrarModal()" aria-label="Cerrar">✕</button>
        <div class="modal-poster" style="${posterEstilo(p)}">
            <div class="modal-poster-grad"></div>
            <h2 class="modal-titulo">${p.titulo}</h2>
        </div>
        <div class="modal-cuerpo">
            <div class="modal-meta">
                <span class="badge-verde">${estrellas(p.calificacion)}</span>
                <span>${p.anio}</span>
                <span>${p.duracion} min</span>
                <span class="pill">${p.genero}</span>
                <span class="pill">${p.clasificacion}</span>
                <span class="pill ${p.disponibleStreaming ? "ok" : "no"}">
                    ${p.disponibleStreaming ? "Disponible en streaming" : "Solo compra / renta"}
                </span>
            </div>
            <p class="modal-desc">${p.descripcion}</p>
            <div class="modal-precios">
                <div class="precio-card"><span>Compra</span><strong>$${p.precioCompra}</strong></div>
                <div class="precio-card"><span>Renta</span><strong>$${p.precioRenta}</strong></div>
            </div>
            <div class="modal-acciones">
                <button class="btn btn-claro" ${p.disponibleStreaming ? "" : "disabled"} onclick="ver(${p.id})">▶ Ver ahora</button>
                <button class="btn btn-verde" onclick="comprar(${p.id})">🛒 Comprar</button>
                <button class="btn btn-borde" onclick="rentar(${p.id})">⏱ Rentar</button>
                <button class="btn btn-texto" onclick="editarPelicula(${p.id})">✏️ Editar</button>
                <button class="btn btn-texto peligro" onclick="confirmarEliminar(${p.id})">🗑️ Eliminar</button>
            </div>
        </div>`;

    modal.classList.remove("oculto");
    document.body.style.overflow = "hidden";
}
function cerrarModal() {
    modal.classList.add("oculto");
    document.body.style.overflow = "";
}
modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

// ---------------- Acciones: comprar / rentar / ver ----------------
function comprar(id) {
    const p = peliPorId(id);
    if (p) mostrarToast(`🛒 Compraste "${p.titulo}" por $${p.precioCompra}`, "ok");
}
function rentar(id) {
    const p = peliPorId(id);
    if (p) mostrarToast(`⏱ Rentaste "${p.titulo}" por $${p.precioRenta} (48 h)`, "ok");
}
function ver(id) {
    const p = peliPorId(id);
    if (!p) return;
    if (!p.disponibleStreaming) {
        mostrarToast(`"${p.titulo}" no está disponible en streaming.`, "error");
        return;
    }
    mostrarToast(`▶ Reproduciendo "${p.titulo}"...`, "ok");
}

// ---------------- Toast (avisos) ----------------
let toastTimer = null;
function mostrarToast(texto, tipo) {
    toast.textContent = texto;
    toast.className = "toast " + (tipo || "ok");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("oculto"), 3200);
}

// ---------------- Administrar: tabla ----------------
function renderAdmin() {
    if (peliculas.length === 0) {
        tablaPeliculas.innerHTML = `<p class="vacio">No hay películas registradas.</p>`;
        return;
    }
    const filas = peliculas
        .map(
            (p) => `
        <tr>
            <td>${p.id}</td>
            <td>${p.titulo}</td>
            <td>${p.genero}</td>
            <td>${p.anio}</td>
            <td>${estrellas(p.calificacion)}</td>
            <td>$${p.precioCompra} / $${p.precioRenta}</td>
            <td class="acciones-tabla">
                <button class="btn-mini editar" onclick="editarPelicula(${p.id})">✏️ Editar</button>
                <button class="btn-mini eliminar" onclick="confirmarEliminar(${p.id})">🗑️ Eliminar</button>
            </td>
        </tr>`
        )
        .join("");

    tablaPeliculas.innerHTML = `
        <table class="tabla">
            <thead>
                <tr>
                    <th>ID</th><th>Título</th><th>Género</th><th>Año</th>
                    <th>Calif.</th><th>Compra/Renta</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>`;
}

// ---------------- Formulario: registrar / actualizar ----------------
formPelicula.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        titulo: $("#titulo").value.trim(),
        genero: $("#genero").value.trim(),
        anio: Number($("#anio").value),
        duracion: Number($("#duracion").value),
        clasificacion: $("#clasificacion").value,
        calificacion: Number($("#calificacion").value),
        precioCompra: Number($("#precioCompra").value),
        precioRenta: Number($("#precioRenta").value),
        disponibleStreaming: $("#disponibleStreaming").checked,
        descripcion: $("#descripcion").value.trim(),
        imagen: $("#imagen").value.trim()
    };

    // Validación del lado del cliente
    const err = validarFormulario(datos);
    if (err) { mostrarMensajeForm(err, "error"); return; }

    try {
        const url = idEnEdicion ? `/peliculas/${idEnEdicion}` : "/peliculas";
        const metodo = idEnEdicion ? "PUT" : "POST";

        const resp = await api(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        await cargarPeliculas();
        renderAdmin();
        cancelarEdicion(false);                 // limpia el formulario sin avisar
        mostrarMensajeForm(resp.mensaje, "ok"); // muestra el éxito real
        mostrarToast(resp.mensaje, "ok");
    } catch (e) {
        mostrarMensajeForm(e.message, "error");
    }
});

function validarFormulario(d) {
    if (!d.titulo) return "El título es obligatorio.";
    if (!d.genero) return "El género es obligatorio.";
    if (!d.anio || d.anio < 1900 || d.anio > 2100) return "El año debe estar entre 1900 y 2100.";
    if (!d.duracion || d.duracion <= 0) return "La duración debe ser mayor a 0 minutos.";
    if (isNaN(d.calificacion) || d.calificacion < 0 || d.calificacion > 10) return "La calificación debe estar entre 0 y 10.";
    if (isNaN(d.precioCompra) || d.precioCompra < 0) return "El precio de compra no puede ser negativo.";
    if (isNaN(d.precioRenta) || d.precioRenta < 0) return "El precio de renta no puede ser negativo.";
    return null;
}

function editarPelicula(id) {
    const p = peliPorId(id);
    if (!p) return;

    idEnEdicion = p.id;
    $("#pelicula-id").value = p.id;
    $("#titulo").value = p.titulo;
    $("#genero").value = p.genero;
    $("#anio").value = p.anio;
    $("#duracion").value = p.duracion;
    $("#clasificacion").value = p.clasificacion;
    $("#calificacion").value = p.calificacion;
    $("#precioCompra").value = p.precioCompra;
    $("#precioRenta").value = p.precioRenta;
    $("#disponibleStreaming").checked = p.disponibleStreaming;
    $("#descripcion").value = p.descripcion;
    $("#imagen").value = p.imagen;

    tituloForm.textContent = "Editar película";
    btnGuardar.textContent = "Actualizar película";
    btnCancelar.classList.add("visible");

    cerrarModal();
    cambiarVista("administrar");
    mostrarMensajeForm(`Editando "${p.titulo}". Modifica los datos y guarda.`, "ok");
}

function cancelarEdicion(conMensaje = true) {
    idEnEdicion = null;
    formPelicula.reset();
    $("#pelicula-id").value = "";
    tituloForm.textContent = "Registrar nueva película";
    btnGuardar.textContent = "Registrar película";
    btnCancelar.classList.remove("visible");
    if (conMensaje) mostrarMensajeForm("Se canceló la edición.", "ok");
}
btnCancelar.addEventListener("click", () => cancelarEdicion(true));

async function confirmarEliminar(id) {
    const p = peliPorId(id);
    if (!p) return;
    if (!confirm(`¿Eliminar "${p.titulo}" del catálogo?`)) return;

    try {
        const resp = await api(`/peliculas/${id}`, { method: "DELETE" });
        cerrarModal();
        if (idEnEdicion === id) cancelarEdicion(false);
        await cargarPeliculas();
        renderAdmin();
        mostrarToast(resp.mensaje, "ok");
    } catch (e) {
        mostrarToast(e.message, "error");
    }
}

function mostrarMensajeForm(texto, tipo) {
    mensajeForm.textContent = texto;
    mensajeForm.className = "mensaje-form " + (tipo === "error" ? "error" : "ok");
}

// ---------------- Estadísticas (dashboard) ----------------
async function renderEstadisticas() {
    try {
        const s = await api("/peliculas/estadisticas");

        statsTarjetas.innerHTML =
            tarjetaStat("🎬", s.total, "Películas en catálogo") +
            tarjetaStat("⭐", s.promedioCalificacion, "Calificación promedio") +
            tarjetaStat("▶️", s.enStreaming, "Disponibles en streaming") +
            tarjetaStat("💵", "$" + s.valorCatalogo, "Valor del catálogo") +
            tarjetaStat("🏆", s.mejorPelicula ? s.mejorPelicula.titulo : "-", "Mejor calificada");

        const entradas = Object.entries(s.porGenero).sort((a, b) => b[1] - a[1]);
        const max = Math.max(...entradas.map((e) => e[1]), 1);
        statsGeneros.innerHTML =
            `<h3 class="bloque-titulo">Películas por género</h3>` +
            entradas
                .map(
                    ([g, n]) => `
            <div class="barra-fila">
                <span class="barra-label">${g}</span>
                <div class="barra-track">
                    <div class="barra-fill" style="width:${((n / max) * 100).toFixed(0)}%">${n}</div>
                </div>
            </div>`
                )
                .join("");
    } catch (e) {
        statsTarjetas.innerHTML = `<p class="vacio">No se pudieron cargar las estadísticas.</p>`;
    }
}
function tarjetaStat(icono, valor, etiqueta) {
    return `<div class="stat-card">
        <div class="stat-icono">${icono}</div>
        <div class="stat-valor">${valor}</div>
        <div class="stat-etiqueta">${etiqueta}</div>
    </div>`;
}

// ---------------- Datalist de géneros para el formulario ----------------
function poblarDatalistGeneros() {
    const dl = $("#generos-lista");
    if (dl) dl.innerHTML = GENEROS_FIJOS.map((g) => `<option value="${g}">`).join("");
}

// ---------------- Autenticación (inicio de sesión) ----------------
const login = document.getElementById("login");
const formLogin = document.getElementById("form-login");
const loginError = document.getElementById("login-error");
const btnLogout = document.getElementById("btn-logout");

function mostrarApp() {
    login.classList.add("oculto");
}
function mostrarLogin() {
    login.classList.remove("oculto");
    formLogin.reset();
    loginError.textContent = "";
}

// Envía usuario y contraseña al backend (POST /login)
formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("contrasena").value;
    try {
        const resp = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, contrasena })
        });
        const datos = await resp.json();
        if (!resp.ok) throw new Error(datos.mensaje || "No se pudo iniciar sesión.");
        sessionStorage.setItem("crxder_sesion", "1");
        loginError.textContent = "";
        mostrarApp();
    } catch (err) {
        loginError.textContent = err.message;
    }
});

// Cerrar sesión: vuelve a mostrar la pantalla de login
btnLogout.addEventListener("click", () => {
    sessionStorage.removeItem("crxder_sesion");
    mostrarLogin();
});

// Si ya había sesión activa en esta pestaña, entra directo
if (sessionStorage.getItem("crxder_sesion") === "1") {
    mostrarApp();
}

// ---------------- Arranque ----------------
poblarDatalistGeneros();
cargarPeliculas();
