// Variables globales para datos y archivos
let excelData = [];
let pdfFiles = [];

/* --- Modal de carga de archivos --- */
const uploadModal = document.getElementById('uploadModal');
const uploadConfirmBtn = document.getElementById('uploadConfirm');
const mainContent = document.getElementById('mainContent');

// Función para verificar si ambos inputs tienen archivos seleccionados
function checkUploads() {
  const excelFileSelected = document.getElementById('fileInput').files.length > 0;
  const pdfFolderSelected = document.getElementById('pdfFolder').files.length > 0;
  // Habilitar el botón solo si ambos están seleccionados
  uploadConfirmBtn.disabled = !(excelFileSelected && pdfFolderSelected);
}

document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('fileNameDisplay').textContent = file.name;
  checkUploads();
  // Procesar Excel
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = e.target.result;
    const workbook = XLSX.read(data, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log('Datos del Excel cargados:', excelData);
  };
  reader.readAsBinaryString(file);
});

document.getElementById('pdfFolder').addEventListener('change', function(e) {
  pdfFiles = Array.from(e.target.files);
  if (pdfFiles.length > 0) {
    const folderName = pdfFiles[0].webkitRelativePath.split('/')[0];
    document.getElementById('filePdfNameDisplay').textContent = 
      `${folderName} (${pdfFiles.length} archivos)`;
  } else {
    document.getElementById('filePdfNameDisplay').textContent = "Ninguna carpeta seleccionada";
  }
  checkUploads();
  console.log('Archivos PDF cargados:', pdfFiles);
});

// Al hacer clic en "Cargar Archivos", si ambos inputs tienen archivos, se oculta el modal y se muestra el contenido principal
uploadConfirmBtn.addEventListener('click', function() {
  if (excelData.length === 0 || pdfFiles.length === 0) {
    alert("Por favor, selecciona el archivo Excel y la carpeta de PDFs.");
    return;
  }
  // Oculta el modal de carga
  uploadModal.style.display = 'none';
  // Muestra el contenido principal de la aplicación
  mainContent.style.display = 'block';

  const proveedor = proveedorSelect.value.trim();
  const internalReference = internalReferenceInput.value.trim();
  const bill = billInput.value.trim();

  if (!excelData || excelData.length === 0) {
    alert("Por favor, carga el archivo Excel.");
    return;
  }

  let filteredData = excelData;
  if (proveedor) {
    filteredData = filteredData.filter(row => {
      return row["Proveedores "] && row["Proveedores "].toString().toLowerCase().includes(proveedor.toLowerCase());
    });
  }
  if (internalReference) {
    filteredData = filteredData.filter(row => {
      return row["REFERENCIA INTERNA"] && row["REFERENCIA INTERNA"].toString().toLowerCase().includes(internalReference.toLowerCase());
    });
  }
  if (bill) {
    filteredData = filteredData.filter(row => {
      return row["# Factura "] && row["# Factura "].toString().toLowerCase().includes(bill.toLowerCase());
    });
  }

  displayRecords(filteredData);
});

/* --- Botón Clear para filtros (un único botón para limpiar todos) --- */
const proveedorSelect = document.getElementById('proveedor');
const internalReferenceInput = document.getElementById('internalReference');
const billInput = document.getElementById('bill');
const clearAll = document.getElementById('clearAll');

function toggleClearButton() {
  // Si alguno de los campos tiene contenido, se muestra el botón de limpiar
  if (proveedorSelect.value || internalReferenceInput.value.trim() || billInput.value.trim()) {
    clearAll.style.display = 'block';
  } else {
    clearAll.style.display = 'none';
  }
}

proveedorSelect.addEventListener('change', toggleClearButton);
internalReferenceInput.addEventListener('input', toggleClearButton);
billInput.addEventListener('input', toggleClearButton);

function clearField(inputElement) {
  inputElement.value = '';
}

clearAll.addEventListener('click', function () {
  proveedorSelect.selectedIndex = 0;
  clearField(internalReferenceInput);
  clearField(billInput);
  clearAll.style.display = 'none';
});

/* --- Filtrado y renderizado de registros --- */
document.getElementById('filterForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Obtener valores de los filtros
  const proveedor = proveedorSelect.value.trim();
  const internalReference = internalReferenceInput.value.trim();
  const bill = billInput.value.trim();

  if (!excelData || excelData.length === 0) {
    alert("Por favor, carga el archivo Excel.");
    return;
  }

  let filteredData = excelData;
  if (proveedor) {
    filteredData = filteredData.filter(row => {
      return row["Proveedores "] && row["Proveedores "].toString().toLowerCase().includes(proveedor.toLowerCase());
    });
  }
  if (internalReference) {
    filteredData = filteredData.filter(row => {
      return row["REFERENCIA INTERNA"] && row["REFERENCIA INTERNA"].toString().toLowerCase().includes(internalReference.toLowerCase());
    });
  }
  if (bill) {
    filteredData = filteredData.filter(row => {
      return row["# Factura "] && row["# Factura "].toString().toLowerCase().includes(bill.toLowerCase());
    });
  }

  displayRecords(filteredData);
});

/* Función para renderizar registros en la tabla */
function displayRecords(records) {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = "";
  if (records.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='6'>No se encontraron resultados.</td></tr>";
  } else {
    records.forEach(row => {
      const tr = document.createElement('tr');
      let manifiestosContent = "";
      if (row["Manifiestos"]) {
        manifiestosContent = `${row["Manifiestos"]}
          <svg class="pdf-icon" data-manifiesto="${row["Manifiestos"]}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" style="cursor:pointer;">
            <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.854 8.803a.5.5 0 1 1-.708-.707L9.243 6H6.475a.5.5 0 1 1 0-1h3.975a.5.5 0 0 1 .5.5v3.975a.5.5 0 1 1-1 0V6.707z"/>
          </svg>`;
      } else {
        manifiestosContent = "No se encuentra";
      }

      tr.innerHTML = `
        <td>${row["# Factura "] || "Sin factura"}</td>
        <td>${manifiestosContent}</td>
        <td>${row["Orden de pedido "] || "Sin orden"}</td>
        <td>${row["Proveedores "] || "Sin proveedor"}</td>
        <td>${row["REFERENCIA INTERNA"] || "Sin referencia interna"}</td>
        <td>${row["Ref de proveedores"] || "Sin referencia de proveedor"}</td>
      `;
      tableBody.appendChild(tr);
    });
    assignPdfIconClickEvents();
  }
}

/* --- Modal para visualizar PDF --- */
function assignPdfIconClickEvents() {
  const pdfIcons = document.querySelectorAll('.pdf-icon');
  pdfIcons.forEach(icon => {
    icon.addEventListener('click', function() {
      const manifiesto = this.getAttribute('data-manifiesto');
      openPdfModal(manifiesto);
    });
  });
}

function openPdfModal(manifiesto) {
  if (!pdfFiles || pdfFiles.length === 0) {
    alert("Por favor, selecciona la carpeta que contiene los PDFs.");
    return;
  }
  const matchingFile = pdfFiles.find(file =>
    file.name.toLowerCase().includes(manifiesto.toLowerCase())
  );
  if (matchingFile) {
    const fileURL = URL.createObjectURL(matchingFile);
    document.getElementById('pdfViewer').src = fileURL;
    document.getElementById('pdfModal').style.display = 'block';
  } else {
    alert("No se encontró el PDF para el manifiesto: " + manifiesto);
  }
}

/* Cerrar el modal de PDF */
document.querySelector('#pdfModal .close').addEventListener('click', function() {
  document.getElementById('pdfModal').style.display = 'none';
});
