const STORAGE_KEY = "orticom_carrito";
const VALORACIONES_KEY = "orticom_valoraciones";

const PRODUCTOS = [
    {
        id: "finan",
        nombre: "Finan v1.2",
        precio: 299,
        imagen: "img/productos/producto1.png",
        descripcion: "Aplicación para la gestión de inversiones y finanzas."
    },
    {
        id: "orgran",
        nombre: "Orgran",
        precio: 249,
        imagen: "img/productos/producto3.png",
        descripcion: "Software para ordenar procesos internos y equipos."
    },
    {
        id: "camiseta",
        nombre: "Camiseta Orticom",
        precio: 19,
        imagen: "img/productos/camiseta.png",
        descripcion: "Merchandising oficial de la marca."
    },
    {
        id: "sudadera",
        nombre: "Sudadera Orticom",
        precio: 39,
        imagen: "img/productos/sudadera.png",
        descripcion: "Sudadera cómoda con el estilo de Orticom Tech."
    },
    {
        id: "polo",
        nombre: "Polo Orticom",
        precio: 29,
        imagen: "img/productos/polo.png",
        descripcion: "Polo clásico para completar el merchandising."
    }
];

let carrito = cargarCarrito();
let productoPendienteEliminar = null;
let modalEliminar = null;

document.addEventListener("DOMContentLoaded", iniciarApp);
window.addEventListener("scroll", actualizarBotonSubir, { passive: true });
window.addEventListener("hashchange", activarPestanaDesdeHash);

function iniciarApp() {
    asegurarContenedorNotificaciones();
    asegurarPanelCarrito();
    asegurarModalEliminar();

    renderCarrito();
    renderizarValoraciones();
    configurarEventosGlobales();
    configurarTema();
    configurarBanner();
    configurarBotonSubir();
    configurarAmpliacionesImagenes();
    activarPestanaDesdeHash();
    actualizarEstadoBotonTema();
}

function cargarCarrito() {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        return guardado ? JSON.parse(guardado) : {};
    } catch {
        return {};
    }
}

function guardarCarrito() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    renderCarrito();
}

function buscarProducto(id) {
    return PRODUCTOS.find((producto) => producto.id === id);
}

function obtenerItems() {
    return Object.entries(carrito).map(([id, datos]) => ({ id, ...datos }));
}

function obtenerTotal() {
    return obtenerItems().reduce((total, item) => total + item.precio * item.cantidad, 0);
}

function obtenerCantidadTotal() {
    return obtenerItems().reduce((total, item) => total + item.cantidad, 0);
}

function formatearPrecio(valor) {
    return `${valor.toFixed(2)} €`;
}

function anadirProducto(id, cantidad = 1) {
    const producto = buscarProducto(id);

    if (!producto || cantidad < 1) {
        return;
    }

    if (carrito[id]) {
        carrito[id].cantidad += cantidad;
    } else {
        carrito[id] = {
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad
        };
    }

    guardarCarrito();
    mostrarNotificacion(`${producto.nombre} añadido al carrito`, "exito");
}

function reducirProducto(id) {
    if (!carrito[id]) {
        return;
    }

    carrito[id].cantidad -= 1;

    if (carrito[id].cantidad <= 0) {
        const nombre = carrito[id].nombre;
        delete carrito[id];
        guardarCarrito();
        mostrarNotificacion(`${nombre} retirado del carrito`, "aviso");
        return;
    }

    guardarCarrito();
    mostrarNotificacion(`Una unidad de ${carrito[id].nombre} retirada`, "aviso");
}

function eliminarProducto(id) {
    if (!carrito[id]) {
        return;
    }

    const nombre = carrito[id].nombre;
    delete carrito[id];
    guardarCarrito();
    mostrarNotificacion(`${nombre} eliminado del carrito`, "aviso");
}

function vaciarCarrito(silencioso = false) {
    carrito = {};
    guardarCarrito();

    if (!silencioso) {
        mostrarNotificacion("El carrito se ha vaciado", "error");
    }
}

function obtenerCantidadProductoCatalogo(id) {
    const contador = document.querySelector(`[data-cantidad="${id}"]`);
    const cantidad = Number.parseInt(contador?.textContent ?? "1", 10);

    return Number.isNaN(cantidad) ? 1 : Math.max(1, cantidad);
}

function cambiarCantidadProductoCatalogo(id, delta) {
    const contador = document.querySelector(`[data-cantidad="${id}"]`);

    if (!contador) {
        return;
    }

    const cantidadActual = Number.parseInt(contador.textContent ?? "1", 10) || 1;
    const cantidadNueva = Math.max(1, cantidadActual + delta);
    contador.textContent = String(cantidadNueva);
}

function alternarLeerMas(boton) {
    const contenedor = boton.closest(".contenedorProducto");

    if (!contenedor) {
        return;
    }

    const extra = contenedor.querySelector(".textoExtraProducto");

    if (!extra) {
        return;
    }

    const abierto = extra.classList.toggle("oculto") === false;
    boton.textContent = abierto ? "Leer menos" : "Leer más";
    boton.setAttribute("aria-expanded", abierto ? "true" : "false");
}

function finalizarCompra() {
    if (!obtenerCantidadTotal()) {
        mostrarNotificacion("No hay productos en el carrito", "aviso");
        return;
    }

    vaciarCarrito(true);
    mostrarNotificacion("Compra finalizada correctamente", "exito");
}

function renderCarrito() {
    renderMiniCarrito();
    renderPaginaCarrito();
    actualizarBadges();
}

function renderMiniCarrito() {
    const lista = document.querySelector("#listaCarritoMini");
    const total = document.querySelector("#totalCarritoMini");
    const contenedorVacio = document.querySelector("#carritoMiniVacio");

    if (!lista || !total) {
        return;
    }

    const items = obtenerItems();
    total.textContent = formatearPrecio(obtenerTotal());

    if (!items.length) {
        if (contenedorVacio) {
            contenedorVacio.classList.remove("oculto");
        }
        lista.innerHTML = "";
        return;
    }

    if (contenedorVacio) {
        contenedorVacio.classList.add("oculto");
    }

    lista.innerHTML = items.map((item) => {
        const subtotal = formatearPrecio(item.precio * item.cantidad);

        return `
            <li class="carritoMiniItem">
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="carritoMiniInfo">
                    <strong>${item.nombre}</strong>
                    <span>${item.cantidad} x ${formatearPrecio(item.precio)} = ${subtotal}</span>
                </div>
                <div class="carritoMiniAcciones">
                    <button type="button" class="btn btn-outline-light btn-sm btnIconoCarrito" data-action="restar" data-id="${item.id}" aria-label="Restar una unidad">
                        <img src="img/icon/menos.svg" alt="" aria-hidden="true">
                    </button>
                    <button type="button" class="btn btn-outline-light btn-sm btnIconoCarrito" data-action="sumar" data-id="${item.id}" aria-label="Sumar una unidad">
                        <img src="img/icon/mas.svg" alt="" aria-hidden="true">
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm" data-action="preguntar-eliminar" data-id="${item.id}">Quitar</button>
                </div>
            </li>
        `;
    }).join("");
}

function renderPaginaCarrito() {
    const contenedor = document.querySelector("#carritoListado");
    const total = document.querySelector("#carritoTotalPagina");
    const vacio = document.querySelector("#carritoVacio");

    if (!contenedor) {
        return;
    }

    const items = obtenerItems();

    if (total) {
        total.textContent = formatearPrecio(obtenerTotal());
    }

    if (!items.length) {
        contenedor.innerHTML = "";
        if (vacio) {
            vacio.classList.remove("oculto");
        }
        return;
    }

    if (vacio) {
        vacio.classList.add("oculto");
    }

    contenedor.innerHTML = items.map((item) => {
        const subtotal = formatearPrecio(item.precio * item.cantidad);

        return `
            <article class="carritoFila">
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="carritoFilaInfo">
                    <h3>${item.nombre}</h3>
                    <p>Precio unitario: ${formatearPrecio(item.precio)}</p>
                </div>
                <div class="carritoFilaCantidad">
                        <button type="button" class="btn btn-outline-light btn-sm btnIconoCarrito" data-action="restar" data-id="${item.id}" aria-label="Restar una unidad">
                            <img src="img/icon/menos.svg" alt="" aria-hidden="true">
                        </button>
                    <span>${item.cantidad}</span>
                        <button type="button" class="btn btn-outline-light btn-sm btnIconoCarrito" data-action="sumar" data-id="${item.id}" aria-label="Sumar una unidad">
                            <img src="img/icon/mas.svg" alt="" aria-hidden="true">
                        </button>
                </div>
                <strong class="carritoFilaSubtotal">${subtotal}</strong>
                <button type="button" class="btn btn-outline-danger btn-sm" data-action="preguntar-eliminar" data-id="${item.id}">Eliminar</button>
            </article>
        `;
    }).join("");
}

function actualizarBadges() {
    const cantidad = obtenerCantidadTotal();

    document.querySelectorAll(".carritoCantidad").forEach((badge) => {
        badge.textContent = cantidad;
        badge.classList.toggle("oculto", cantidad === 0);
    });
}

function asegurarContenedorNotificaciones() {
    if (document.querySelector("#notificaciones")) {
        return;
    }

    const contenedor = document.createElement("div");
    contenedor.id = "notificaciones";
    contenedor.className = "notificacionesFlotantes";
    document.body.appendChild(contenedor);
}

function mostrarNotificacion(mensaje, tipo = "info") {
    const contenedor = document.querySelector("#notificaciones");

    if (!contenedor) {
        return;
    }

    const alerta = document.createElement("div");
    alerta.className = `notificacion alert alert-${tipoBootstrap(tipo)} shadow-sm`;
    alerta.setAttribute("role", "alert");

    alerta.innerHTML = `
        <span>${mensaje}</span>
        <button type="button" class="btn-close" aria-label="Cerrar"></button>
    `;

    alerta.querySelector(".btn-close").addEventListener("click", () => cerrarNotificacion(alerta));

    contenedor.appendChild(alerta);

    requestAnimationFrame(() => {
        alerta.classList.add("visible");
    });

    setTimeout(() => cerrarNotificacion(alerta), 2600);
}

function cerrarNotificacion(alerta) {
    alerta.classList.remove("visible");
    alerta.addEventListener("transitionend", () => alerta.remove(), { once: true });
}

function tipoBootstrap(tipo) {
    if (tipo === "exito") return "success";
    if (tipo === "error") return "danger";
    if (tipo === "aviso") return "warning";
    return "info";
}

function asegurarPanelCarrito() {
    if (document.querySelector("#carritoPanel")) {
        return;
    }

    const panel = document.createElement("aside");
    panel.id = "carritoPanel";
    panel.className = "carritoPanel";
    panel.setAttribute("aria-label", "Resumen del carrito");
    panel.innerHTML = `
        <div class="carritoPanelCabecera">
            <h2>Carrito</h2>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar carrito" data-carrito-cerrar></button>
        </div>
        <div class="carritoPanelCuerpo">
            <p id="carritoMiniVacio" class="carritoMiniVacio">El carrito está vacío.</p>
            <ul id="listaCarritoMini" class="carritoMiniLista"></ul>
            <div class="carritoMiniTotal">
                <span>Total</span>
                <strong id="totalCarritoMini">0,00 €</strong>
            </div>
            <a href="carrito.html" class="btnRojo carritoPanelEnlace">Ver carrito completo</a>
        </div>
    `;

    const backdrop = document.createElement("div");
    backdrop.className = "carritoBackdrop oculto";
    backdrop.setAttribute("data-carrito-cerrar", "true");

    document.body.appendChild(panel);
    document.body.appendChild(backdrop);
}

function abrirPanelCarrito() {
    const panel = document.querySelector("#carritoPanel");
    const backdrop = document.querySelector(".carritoBackdrop");
    const boton = document.querySelector("[data-carrito-toggle]");

    if (!panel || !backdrop) {
        return;
    }

    panel.classList.add("abierto");
    backdrop.classList.remove("oculto");

    if (boton) {
        boton.setAttribute("aria-expanded", "true");
    }
}

function cerrarPanelCarrito() {
    const panel = document.querySelector("#carritoPanel");
    const backdrop = document.querySelector(".carritoBackdrop");
    const boton = document.querySelector("[data-carrito-toggle]");

    if (!panel || !backdrop) {
        return;
    }

    panel.classList.remove("abierto");
    backdrop.classList.add("oculto");

    if (boton) {
        boton.setAttribute("aria-expanded", "false");
    }
}

function togglePanelCarrito() {
    const panel = document.querySelector("#carritoPanel");

    if (!panel) {
        return;
    }

    if (panel.classList.contains("abierto")) {
        cerrarPanelCarrito();
    } else {
        abrirPanelCarrito();
    }
}

function asegurarModalEliminar() {
    if (document.querySelector("#modalEliminarProducto")) {
        modalEliminar = bootstrap.Modal.getOrCreateInstance(document.querySelector("#modalEliminarProducto"));
        return;
    }

    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "modalEliminarProducto";
    modal.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-light">
                <div class="modal-header">
                    <h2 class="modal-title fs-5">Confirmar eliminación</h2>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <p id="textoEliminarProducto">¿Seguro que quieres eliminar este producto del carrito?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirmarEliminarProducto">Eliminar</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modalEliminar = bootstrap.Modal.getOrCreateInstance(modal);

    modal.querySelector("#confirmarEliminarProducto").addEventListener("click", () => {
        if (productoPendienteEliminar) {
            eliminarProducto(productoPendienteEliminar);
            productoPendienteEliminar = null;
        }
        modalEliminar.hide();
    });
}

function pedirEliminarProducto(id) {
    const producto = carrito[id];

    if (!producto) {
        return;
    }

    productoPendienteEliminar = id;
    const texto = document.querySelector("#textoEliminarProducto");

    if (texto) {
        texto.textContent = `¿Quieres eliminar ${producto.nombre} del carrito?`;
    }

    modalEliminar.show();
}

function cargarValoraciones() {
    try {
        const guardado = localStorage.getItem(VALORACIONES_KEY);
        return guardado ? JSON.parse(guardado) : {};
    } catch {
        return {};
    }
}

function guardarValoracion(productoId, calificacion) {
    const valoraciones = cargarValoraciones();
    valoraciones[productoId] = {
        puntuacion: calificacion,
        fecha: new Date().toISOString()
    };
    localStorage.setItem(VALORACIONES_KEY, JSON.stringify(valoraciones));
    renderizarValoraciones();
    mostrarNotificacion(`Gracias por valorar con ${calificacion} estrellas`, "exito");
}

function renderizarValoraciones() {
    const valoraciones = cargarValoraciones();

    document.querySelectorAll(".valoracionProducto").forEach((contenedor) => {
        const productoId = contenedor.dataset.producto;
        const valoracion = valoraciones[productoId];
        const puntuacion = valoracion ? Math.round(valoracion.puntuacion) : 0;

        contenedor.querySelectorAll(".estrella").forEach((estrella) => {
            const valor = Number.parseInt(estrella.dataset.valor, 10);
            estrella.classList.toggle("seleccionada", valor <= puntuacion);
        });
    });
}

function configurarEventosGlobales() {
    document.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button, a");

        if (!boton) {
            return;
        }

        const estrella = evento.target.closest(".estrella");
        if (estrella) {
            const contenedor = estrella.closest(".valoracionProducto");
            if (contenedor) {
                const productoId = contenedor.dataset.producto;
                const calificacion = Number.parseInt(estrella.dataset.valor, 10);
                guardarValoracion(productoId, calificacion);
                return;
            }
        }

        if (boton.matches("[data-carrito-toggle]")) {
            togglePanelCarrito();
            return;
        }

        if (boton.matches("[data-carrito-cerrar]")) {
            cerrarPanelCarrito();
            return;
        }

        if (boton.id === "btnSubir") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (boton.id === "botonTema") {
            setTimeout(actualizarEstadoBotonTema, 0);
            setTimeout(() => {
                const oscuro = document.body.classList.contains("temaOscuro");
                mostrarNotificacion(oscuro ? "Tema oscuro activado" : "Tema claro activado", "info");
            }, 0);
            return;
        }

        const accion = boton.dataset.action;

        if (!accion) {
            return;
        }

        const id = boton.dataset.id;

        if (accion === "anadir" || accion === "sumar") {
            const cantidad = boton.closest(".productoCatalogo") ? obtenerCantidadProductoCatalogo(id) : 1;
            anadirProducto(id, cantidad);
        }

        if (accion === "restar") {
            const productoCarrito = carrito[id];

            if (productoCarrito && productoCarrito.cantidad === 1) {
                pedirEliminarProducto(id);
            } else {
                reducirProducto(id);
            }
        }

        if (accion === "cantidad-sumar") {
            cambiarCantidadProductoCatalogo(id, 1);
        }

        if (accion === "cantidad-restar") {
            cambiarCantidadProductoCatalogo(id, -1);
        }

        if (accion === "leer-mas") {
            alternarLeerMas(boton);
        }

        if (accion === "eliminar") {
            eliminarProducto(id);
        }

        if (accion === "preguntar-eliminar") {
            pedirEliminarProducto(id);
        }

        if (accion === "vaciar") {
            vaciarCarrito();
        }

        if (accion === "finalizar-compra") {
            finalizarCompra();
        }
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            cerrarPanelCarrito();
        }
    });
}

function configurarTema() {
    const boton = document.querySelector("#botonTema");

    if (!boton) {
        return;
    }

    boton.setAttribute("aria-pressed", document.body.classList.contains("temaOscuro") ? "true" : "false");
}

function actualizarEstadoBotonTema() {
    const boton = document.querySelector("#botonTema");

    if (!boton) {
        return;
    }

    boton.setAttribute("aria-pressed", document.body.classList.contains("temaOscuro") ? "true" : "false");
}

function configurarBanner() {
    const iframe = document.querySelector(".iframeBannerDestacado");

    if (!iframe || !iframe.dataset.src) {
        return;
    }

    const cargar = () => {
        if (!iframe.getAttribute("src")) {
            iframe.setAttribute("src", iframe.dataset.src);
        }
    };

    if ("requestIdleCallback" in window) {
        requestIdleCallback(cargar, { timeout: 1500 });
    } else {
        setTimeout(cargar, 700);
    }
}

function configurarBotonSubir() {
    if (!document.querySelector(".carrusel")) {
        return;
    }

    if (document.querySelector("#btnSubir")) {
        return;
    }

    const boton = document.createElement("button");
    boton.id = "btnSubir";
    boton.type = "button";
    boton.className = "btnSubir oculto";
    boton.setAttribute("aria-label", "Subir al inicio de la página");
    boton.textContent = "Subir";

    document.body.appendChild(boton);
    actualizarBotonSubir();
}

function actualizarBotonSubir() {
    const boton = document.querySelector("#btnSubir");

    if (!boton) {
        return;
    }

    boton.classList.toggle("oculto", window.scrollY < 260);
}

function activarPestanaDesdeHash() {
    if (!window.bootstrap || !window.location.hash) {
        return;
    }

    const trigger = document.querySelector(
        `[data-bs-toggle="tab"][href="${window.location.hash}"], [data-bs-toggle="tab"][data-bs-target="${window.location.hash}"]`
    );

    if (!trigger) {
        return;
    }

    bootstrap.Tab.getOrCreateInstance(trigger).show();
}

function configurarAmpliacionesImagenes() {
    document.querySelectorAll(".enlaceImagen").forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            const destino = enlace.getAttribute("href");

            if (!destino || !destino.startsWith("#")) {
                return;
            }

            const modalImagen = document.querySelector(destino);

            if (!modalImagen) {
                return;
            }

            modalImagen.classList.add("abierta");
            window.location.hash = destino;
        });
    });

    document.querySelectorAll(".cerrarImagen").forEach((boton) => {
        boton.addEventListener("click", () => {
            const modalImagen = boton.closest(".imagenAmpliada");

            if (modalImagen) {
                modalImagen.classList.remove("abierta");
            }

            history.replaceState(null, "", window.location.pathname + window.location.search);
        });
    });
}