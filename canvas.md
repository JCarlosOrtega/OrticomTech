En destacados.html agregue un bloque dentro de main con un canvas que tuviera un id fijo:
id del canvas: canvasDestacados
Este paso es obligatorio porque canvas.js necesita un elemento real donde dibujar.

Cargar Fabric.js antes de canvas.js
Al final de destacados.html, antes de cerrar body, deje este orden de scripts:
primero fabric.min.js
despues canvas.js
Si el orden se invierte, canvas.js se ejecuta sin la libreria y falla.

Instalar Fabric en local
Como Fabric ya no estaba en el proyecto, la volvi a instalar localmente con:
npm install fabric@5.3.0
Con esto se actualizo package.json y quedo disponible la ruta local de la libreria.

Corregir el arranque de canvas.js
En canvas.js adapte el inicio para buscar el canvas real de la pagina:
const canvasEl = document.getElementById("canvasDestacados")
Tambien agregue control de seguridad:
si no existe canvasEl o no existe window.fabric, el script termina sin romper la pagina.
