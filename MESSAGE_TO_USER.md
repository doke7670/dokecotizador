**He realizado una mejora para diagnosticar por qué no funciona el botón de "Generar PDF".**

"No funciona" puede deberse a varias causas. La más probable es que los archivos de la librería para generar PDFs (`jsPDF`) no se estén cargando correctamente, aunque estén en la carpeta `libs/`.

**La Corrección:**
He añadido una verificación en `js/outputGenerator.js`. Ahora, si la aplicación no detecta las librerías `jsPDF` necesarias, te mostrará una alerta específica indicando cuál es el problema.

**Por favor, prueba lo siguiente:**
1.  **Recarga la aplicación** (`http://localhost:8000`) con `Ctrl+Shift+R` para evitar la caché.
2.  Abre las **Herramientas de Desarrollador** con la tecla `F12` y ve a la pestaña **Consola**. Esto nos ayudará a ver cualquier error que las nuevas alertas no capturen.
3.  Agrega al menos un ítem a la cotización.
4.  Haz clic en el botón **"Generar PDF (WhatsApp)"**.

**¿Qué esperar?**
*   **Caso A (Éxito):** Se descarga el archivo PDF con normalidad.
*   **Caso B (Error de Librería):** Deberías ver una alerta como `"Error: La librería jsPDF no está cargada..."` o `"Error: El plugin jsPDF-AutoTable no está cargado..."`. Si ves esto, significa que hay un problema con cómo el navegador está accediendo a los archivos en la carpeta `libs/`.
*   **Caso C (Otro Error):** Si no pasa nada y no hay alerta, por favor, **copia y pega cualquier mensaje de error que aparezca en la pestaña Consola** de las herramientas de desarrollador.

Dime qué sucede (Caso A, B o C) y, si es C, envíame el error. Esto nos dará la pista definitiva para solucionar el problema.
