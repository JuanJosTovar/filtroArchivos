// frontend/app.js

// Variable global para almacenar los datos del Excel
let excelData = [];
// Variable global para almacenar la lista de archivos PDF seleccionados
let pdfFiles = [];

/**
 * Cargar el archivo Excel y procesarlo usando SheetJS.
 */
document.getElementById('excelFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = e.target.result;
    // Lee el archivo Excel (en modo 'binary')
    const workbook = XLSX.read(data, { type: 'binary' });
    // Se asume que el primer sheet contiene la información a filtrar
    const sheetName = workbook.SheetNames[0];
    excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log('Datos del Excel cargados:', excelData);
  };
  reader.readAsBinaryString(file);
});

/**
 * Cargar la carpeta de PDFs. Se usa un input con webkitdirectory para permitir la selección de carpetas.
 */
document.getElementById('pdfFolder').addEventListener('change', function(e) {
  // Se obtiene la lista de archivos (FileList) y se convierte en array
  pdfFiles = Array.from(e.target.files);
  console.log('Archivos PDF cargados:', pdfFiles);
});

/**
 * Al enviar el formulario, se filtran los datos del Excel y se muestran en la tabla.
 */
document.getElementById('filterForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Obtener valores de los filtros
  const proveedor = document.getElementById('proveedor').value.trim();
  const internalReference = document.getElementById('internalReference').value.trim();
  const bill = document.getElementById('bill').value.trim();

  // Verificar que se haya cargado el archivo Excel
  if (!excelData || excelData.length === 0) {
    alert("Por favor, selecciona y carga el archivo Excel.");
    return;
  }

  // Filtrar los datos del Excel según los criterios
  let filteredData = excelData;

  if (proveedor) {
    filteredData = filteredData.filter(row => {
      // Se asume que el Excel tiene una columna llamada "Proveedores"
      return row["Proveedores "] && row["Proveedores "].toString().toLowerCase().includes(proveedor.toLowerCase());
    });
  }

  if (internalReference) {
    filteredData = filteredData.filter(row => {
      // Se asume que el Excel tiene una columna llamada "Referencia Interna"
      return row["REFERENCIA INTERNA"] && row["REFERENCIA INTERNA"].toString().toLowerCase().includes(internalReference.toLowerCase());
    });
  }

  if (bill) {
    filteredData = filteredData.filter(row => {
      // Se asume que el Excel tiene una columna llamada "Factura" o "# Factura"
      return row["# Factura "] && row["# Factura "].toString().toLowerCase().includes(bill.toLowerCase());
    });
  }

  // Mostrar los resultados en la tabla
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = ""; // Limpiar resultados anteriores

  if (filteredData.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='6'>No se encontraron resultados.</td></tr>";
  } else {
    filteredData.forEach(row => {
      const tr = document.createElement('tr');

      // Construir la celda para "Manifiestos" con el ícono SVG si existe valor.
      // Se usa un atributo data-manifiesto para guardar el código y luego poder buscar el PDF.
      let manifiestosContent = "";
      if (row["Manifiestos"]) {
        manifiestosContent = `${row["Manifiestos"]}
          <svg class="pdf-icon" data-manifiesto="${row["Manifiestos"]}" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="cursor:pointer;">
            <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.854 8.803a.5.5 0 1 1-.708-.707L9.243 6H6.475a.5.5 0 1 1 0-1h3.975a.5.5 0 0 1 .5.5v3.975a.5.5 0 1 1-1 0V6.707z"/>
          </svg>`;
      } else {
        manifiestosContent = "No se encuentra";
      }

      // Se asume que los nombres de las columnas en el Excel son:
      // "# Factura ", "Manifiestos", "Orden de pedido ", "Proveedores ", "REFERENCIA INTERNA", "Ref de proveedores"
      tr.innerHTML = `
        <td>${row["# Factura "] || "Sin factura"}</td>
        <td>${manifiestosContent || "No se encuentra"}</td>
        <td>${row["Orden de pedido "] || "Sin orden"}</td>
        <td>${row["Proveedores "] || "Sin proveedor"}</td>
        <td>${row["REFERENCIA INTERNA"] || "Sin referencia interna"}</td>
        <td>${row["Ref de proveedores"] || "Sin referencia de proveedor"}</td>
      `;
      
      tableBody.appendChild(tr);
    });

    // Asignar los eventos de clic a los íconos SVG insertados
    assignPdfIconClickEvents();
  }
});

/**
 * Función para asignar eventos a los íconos SVG de la columna "Manifiestos".
 * Cuando se hace clic, se intenta abrir el PDF correspondiente usando la lista de archivos cargados.
 */
function assignPdfIconClickEvents() {
  const pdfIcons = document.querySelectorAll('.pdf-icon');
  pdfIcons.forEach(icon => {
    icon.addEventListener('click', function() {
      const manifiesto = this.getAttribute('data-manifiesto');
      openPdfModal(manifiesto);
    });
  });
}

/**
 * Función para abrir el modal y cargar el PDF correspondiente.
 * Busca en el array pdfFiles un archivo cuyo nombre incluya el valor del manifiesto.
 * Si lo encuentra, crea un URL objeto y lo asigna al src del embed del modal.
 */
function openPdfModal(manifiesto) {
  if (!pdfFiles || pdfFiles.length === 0) {
    alert("Por favor, selecciona la carpeta que contiene los PDFs.");
    return;
  }

  // Buscar el archivo que contenga el manifiesto en su nombre (búsqueda insensible a mayúsculas)
  const matchingFile = pdfFiles.find(file =>
    file.name.toLowerCase().includes(manifiesto.toLowerCase())
  );

  if (matchingFile) {
    const fileURL = URL.createObjectURL(matchingFile);
    document.getElementById('pdfViewer').src = fileURL;
    // Mostrar el modal (ventana emergente)
    document.getElementById('pdfModal').style.display = 'block';
  } else {
    alert("No se encontró el PDF para el manifiesto: " + manifiesto);
  }
}

// Cerrar el modal cuando se hace clic en el botón "X"
document.querySelector('#pdfModal .close').addEventListener('click', function() {
  document.getElementById('pdfModal').style.display = 'none';
});
