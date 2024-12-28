//------------------------------------------------------------------------------------------------------------------------------------------------tab functions
// Función para obtener datos de la API y crear el gráfico
const apiUrl = "http://127.0.0.1:8000/data_dia/";



//lista de contenido a ocultar:


//ventas diarias containers
//ventas filtradas container
//botones de filtros
//master catalogo
//tabla dispersion de inventarios
//loading spinner
//inicio (andromeda picture container)



    //INICIO TAB  

// Definir funciones para cada pestaña
const tabFunctions = {
    // INICIO TAB  
    "#tab1": () => {
        hideAllContent(); // Oculta todo primero
        toggleDisplay(["inicio","inventario-chart"], "flex"); // Muestra solo el contenido de la pestaña inicial
    },

    // COMERCIAL TAB    
    "#tab2-sub2": () => {
        hideAllContent(); // Oculta todo primero
        toggleDisplay(["filtros-botones","ventasdiarias-container","ventasdiarias"], "block");
        destroyAllCharts();
        createDailySalesChart1();
    },

    // RESURTIDO TAB    
    "#tab3-sub1": () => {
        hideAllContent(); // Oculta todo primero
        toggleDisplay(["TableContainer"], "flex");
    },

    // DISPERSION SUB TAB
    "#tab3-sub2": () => {
        hideAllContent(); // Oculta todo primero
        toggleDisplay(["DispersionContainer"], "flex");
        hideLoadingSpinner();
    },

    // CATALOGO TAB 
    "#tab4": () => {
        hideAllContent(); // Oculta todo primero
        toggleDisplay(["master-form"], "flex");
        hideLoadingSpinner();
    }
};

// Ejecuta las funciones correspondientes al mostrar la pestaña
$(".nav-link").click(function() {
    const target = $(this).attr("href");
    if (tabFunctions[target]) {
        // Ejecuta directamente la función asociada a la pestaña
        tabFunctions[target]();
    }
});

//---------------------------------------------------------------------------------------------------------funcion para apagar/encennder divs
async function toggleDisplay(ids, display) {
    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = display;
        } else {
            console.warn(`Elemento con id "${id}" no encontrado.`);
        }
    });
}

//--------------------------------------------------------------------------- Función para ocultar todos los elementos por defecto
async function hideAllContent() {
    // Lista de todos los IDs de contenido que se pueden mostrar
    const allContentIds = [
        "inicio",
        "filtros-botones",
        "master-form",
        "ventasdiarias",
        "filtros",
        "TableContainer",
        "sellOut",
        "DispersionContainer",
        "ventasChartfiltered",
        "loadingSpinner"
    ];
    toggleDisplay(allContentIds, "none");
}


//------------------------------------------------------------------------------------------------------------------------------------------------------Modal Show
async function showModal(title, content) {
    // Seleccionamos el modal y sus elementos
    const modalElement = document.getElementById('genericModal');
    const modalTitle = modalElement.querySelector('.modal-title');
    const modalBody = modalElement.querySelector('.modal-body');

    // Actualizamos el contenido dinámico
    modalTitle.textContent = title;
    modalBody.innerHTML = content;

    // Usamos Bootstrap para mostrar el modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

//----------------------------------------------------------------------------------------------------------------------------------------------------spinner show
// Función para encender el spinner
async function showLoadingSpinner() {
    document.getElementById("loadingSpinner").style.display = "block";
}

// Función para apagar el spinner
async function hideLoadingSpinner() {
    document.getElementById("loadingSpinner").style.display = "none";
}



//-----------------------------------------------------------------------------------------------funcion para botones de filtrado de fechas

document.addEventListener('click', function (event) {
    // Manejar clics en el dropdown de Año
    if (event.target.matches('[data-year]')) {
        event.preventDefault();
        const añoSeleccionado = event.target.getAttribute('data-year');
        const nombreAño = event.target.textContent;
        document.getElementById('dropdownMenuButtonYear').textContent = nombreAño;
        localStorage.setItem('añoSeleccionado', añoSeleccionado || null);
    }

    // Manejar clics en el dropdown de Mes
    if (event.target.matches('[data-month]')) {
        event.preventDefault();
        const mesSeleccionado = event.target.getAttribute('data-month');
        const nombreMes = event.target.textContent;
        document.getElementById('dropdownMenuButtonMonth').textContent = nombreMes;
        localStorage.setItem('mesSeleccionado', mesSeleccionado || null);
    }

    // Manejar clics en el botón "Buscar"
    if (event.target.id === 'buscarBtn') {
        showLoadingSpinner();
        //OCULATMOS EL PREVIEW DE VENTAS PARA DARLE PROTAGONISMO AL FILTRADO
        toggleDisplay(["ventasdiarias"], "none");
        toggleDisplay(["ventasChartfiltered"], "block");
        

        const añoSeleccionado = localStorage.getItem('añoSeleccionado');
        const mesSeleccionado = localStorage.getItem('mesSeleccionado');

        // Construir la URL de la API, añadiendo parámetros solo si son necesarios
        let apiUrlFiltered = `http://127.0.0.1:8000/data_filt/`;

        // Inicializar los parámetros para construir la URL correctamente
        const queryParams = [];
        if (mesSeleccionado && mesSeleccionado !== "null") {
            queryParams.push(`mes=${mesSeleccionado}`);
        }
        if (añoSeleccionado && añoSeleccionado !== "null") {
            queryParams.push(`ano=${añoSeleccionado}`);
        }

        // Añadir los parámetros a la URL si hay alguno
        if (queryParams.length > 0) {
            apiUrlFiltered += `?${queryParams.join('&')}`;
        }

        // Realizar la solicitud a la API
        fetch(apiUrlFiltered)
            .then(response => {
                if (!response.ok) throw new Error('Error en la solicitud');
                return response.json();
            })
            .then(data => createFilteredSalesChartHighcharts(data))
           //.then(data => createFilteredSalesChart(data))
            .catch(error => console.error('Error:', error))
            .finally(() => hideLoadingSpinner());
    }

});


//------------------------------------------------------------------------------------------------------------------------ Colores específicos para cada año
const yearColors = {
    2022: '#008000',      // 
    2023: '#fb486b',      //  
    2024: '#17cd72',      // 
    2025: '#000000'       // Negro o cualquier color que desees para un año adicional
};


//----------------hiders and showers----------------------------------------------------------------------

// document.getElementById("inicio").style.display = "none";
// document.getElementById("master-form").style.display = "none";
// document.getElementById("DispersionContainer").style.display = "none";
// document.getElementById("ventasChartfiltered").style.display = "none";
// document.getElementById("ventasdiarias-container").style.display = "none";
// document.getElementById("loadingSpinner").style.display = "none";
// document.getElementById("sellOut").style.display = "none";
// document.getElementById("filtros-botones").style.display = "none";
// document.getElementById('TableContainer').style.display = 'none';



//----------------Chart Destroyer----------------------------------------------------------------------

// Definir charts en el ámbito global para que esté disponible en todas las funciones
let charts = []; // Lista para almacenar todas las instancias de gráficos activos
// Función para destruir todos los gráficos
async function destroyAllCharts() {
    charts.forEach(chart => {
        if (chart) {
            chart.destroy();  // Destruye cada instancia de gráfico
        }
    });
    charts = []; // Limpia la lista después de destruir todos los gráficos

    // Limpia todos los canvas en la página para asegurarse de que estén listos
    $('canvas').each(function() {
        const context = this.getContext('2d');
        context.clearRect(0, 0, this.width, this.height); // Limpia el canvas
    });
}


//----------------tooltip for ceres locator----------------------------------------------------------------------

document.querySelectorAll('.tooltip').forEach((tooltip) => {
    tooltip.style.zIndex = '99999';



});
//----------------submenu click activator----------------------------------------------------------------------

//Función que anima el submenu del submenu de opciones

document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar todos los botones que alternan submenús
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    // Iterar sobre cada botón para asignar el evento
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            event.preventDefault(); // Evitar el comportamiento por defecto del enlace
            
            // Encontrar el submenú asociado al botón actual
            const submenu = this.nextElementSibling; // El submenú está justo después del botón en el HTML

            // Verificar que el submenú existe
            if (submenu && submenu.classList.contains('submenu')) {
                // Alternar la clase 'active' en el submenú correspondiente
                submenu.classList.toggle('active');
                
                // Si el submenú está activo, asignar eventos a las opciones del submenú
                if (submenu.classList.contains('active')) {
                    submenu.querySelectorAll('.nav-link').forEach(option => {
                        option.addEventListener('click', function(event) {
                            event.preventDefault();
                            console.log(`Click en la opción: ${this.textContent}`);
                        });
                    });
                }
            }
        });
    });
});


//----------------------------------------------------------------------------------------Función para crear un gráfico de inicio en el SO

async function createDailySalesChart1() {
    showLoadingSpinner();
    try {
        const response = await fetch(apiUrl);  // Realiza la solicitud a la API
        const data = await response.json();    // Convierte la respuesta en JSON

        // Estructurar los datos por año y semana
        const dataByYear = {};

        data.forEach(item => {
            const year = item.ano;
            const semana = item.semana;
            const sales = item.total_venta_unidades;

            // Inicializar el año en el objeto si no existe
            if (!dataByYear[year]) {
                dataByYear[year] = {};
            }

            // Guardar ventas para cada semana en el año correspondiente
            dataByYear[year][semana] = sales;
        });

        // Crear conjuntos de datos para Chart.js con los colores asignados
        const datasets = Object.keys(dataByYear).map(year => {
            return {
                label: `Ventas ${year}`,
                data: Object.values(dataByYear[year]),
                backgroundColor: yearColors[year] || '#cccccc',  // Usa el color especificado o un color por defecto
                borderColor: yearColors[year] || '#cccccc',
                borderWidth: 1,
                type: 'bar'  // Tipo de gráfico para ventas: barras
            };
        });

        // Generar etiquetas (semanas) tomando las semanas de un año como referencia
        const etiquetas = Object.keys(dataByYear[Object.keys(dataByYear)[0]]);

        // Configuración del gráfico
        const ctx = document.getElementById('ventasdiarias').getContext('2d');
        const ventasdiariasChart = new Chart(ctx, {
            type: 'bar',  // Tipo principal del gráfico: barras
            data: {
                labels: etiquetas,
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                stacked: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Semana'
                        },
                        ticks: {
                            autoSkip: true,
                            maxRotation: 90,
                            minRotation: 90,
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Ventas en Unidades'
                        }
                    }
                },
                plugins: {
                    datalabels: {
                        anchor: 'end',             // Posición de la etiqueta
                        align: 'top',              // Alineación de la etiqueta
                        color: '#444',             // Color del texto de la etiqueta
                        font: {
                            size: 10,
                            weight: 'bold'
                        },
                        formatter: (value) => `${value}` // Formato de los valores en las etiquetas
                    }
                }
            },
            plugins: [ChartDataLabels]  // Habilitar el plugin de etiquetas de datos
        });

        charts.push(ventasdiariasChart); // Añade el gráfico a la lista de instancias
    } catch (error) {
        console.error("Error al obtener los datos de la API:", error);
    } finally {
        hideLoadingSpinner();
    }
}


//----------------------------------------------------------------------------------------Función para crear un gráfico con los datos filtrados
async function createFilteredSalesChart(data) {
    destroyAllCharts(); // Asegúrate de eliminar los gráficos anteriores

    // Estructurar los datos por año y fecha
    const dataByYear = {};
    data.forEach(item => {
        const year = item.ano;
        const fecha = item.semana;
        const sales = item.suma_venta_unidades;

        // Inicializar el año en el objeto si no existe
        if (!dataByYear[year]) {
            dataByYear[year] = {};
        }

        // Guardar ventas para cada fecha en el año correspondiente
        dataByYear[year][fecha] = sales;
    });

    // Crear conjuntos de datos para Chart.js con los colores asignados
    const datasets = Object.keys(dataByYear).map(year => {
        return {
            label: `Ventas ${year}`,
            data: Object.values(dataByYear[year]),
            backgroundColor: yearColors[year] || '#cccccc',  // Usa el color especificado o un color por defecto
            borderColor: yearColors[year] || '#cccccc',
            borderWidth: 1,
            datalabels: {
                anchor: 'end',
                align: 'top',
                color: 'black',
                formatter: function (value) {
                    return value; // Mostrar el valor de cada punto de datos correctamente
                },
                font: {
                    size: 10
                }
            }
        };
    });

    // Generar etiquetas (fechas) tomando las fechas de un año como referencia
    const etiquetas = Object.keys(dataByYear[Object.keys(dataByYear)[0]]);

    // Configuración del gráfico
    const ctx = document.getElementById('ventasChartfiltered').getContext('2d');
    const ventasChartfilteredChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Asegúrate de que el gráfico ocupe todo el espacio disponible
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: function (value) {
                        return value; // Mostrar el valor correctamente en cada punto
                    },
                    font: {
                        size: 10
                    },
                    color: 'black' // Puedes cambiar el color de las etiquetas si es necesario
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    },
                    ticks: {
                        autoSkip: true,
                        maxRotation: 90,
                        minRotation: 90,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ventas en Unidades'
                    },
                    ticks: {
                        stepSize: 10 // Establecer el tamaño de cada paso en el eje Y a 100 unidades
                    }
                }
            }
        },
        plugins: [ChartDataLabels] // Agregar el plugin aquí
    });

    charts.push(ventasChartfilteredChart); // Añade el gráfico a la lista de instancias
}



//------------------------------------------------------------------------LLENA LA TABLA CON LA INFORMACION DE LA API.

    // Función para llenar la tabla de resumen (DOH Data)
    async function fillResumenTable() {
        showLoadingSpinner();
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        const resumenTableBody = document.querySelector("#resumenTable tbody");
        resumenTableBody.innerHTML = ""; // Limpia contenido previo

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.ano}</td>
                <td>${row.semana}</td>
                <td>${row.codigo_tienda}</td>
                <td>${row.codigo_barras}</td>
                <td>${row.total_venta_unidades}</td>
                <td>${row.inventario_actual}</td>
                <td>${row.total_ventas_en_pesos}</td>
                <td>${row.doh}</td>
            `;
            resumenTableBody.appendChild(tr);
            hideLoadingSpinner();
        });
    }


    //-----------------------------------------------------DATA TABLES CREATOR--------------------------------------------------
    // Función para crear datatables
    $(document).ready(function () {
        $('#dispersionTable').DataTable({
            ajax: {
                url: 'http://127.0.0.1:8000/dispersion/', // Tu endpoint FastAPI
                dataSrc: '' // Los datos están directamente en la raíz del JSON
            },
            columns: [
                { data: 'codigo_barras', title: 'Código de Barras' },
                { data: 'codigo_tienda', title: 'Código de Tienda' },
                { data: 'suma_ventas_5_semanas', title: 'Ventas 5 Semanas' },
                { data: 'venta_diaria', title: 'Venta Diaria' },
                { data: 'inventario_mas_reciente', title: 'Inventario Reciente' },
                { data: 'dias_inventario', title: 'Días Inventario' },
                { data: 'ultima_fecha_inventario', title: 'Última Fecha Inventario' },
                { data: 'ultima_fecha_venta', title: 'Última Fecha Venta' },
                { data: 'rango_dias_inventario', title: 'Rango Días Inventario' },
                { data: 'tipo_de_rotacion', title: 'Tipo de Rotación' }
            ],
            dom: 'Bfrtip', // Habilitar la barra de botones
            buttons: [
                {
                    extend: 'copy',
                    text: 'Copiar'
                },
                {
                    extend: 'csv',
                    text: 'Exportar CSV'
                },
                {
                    extend: 'excel',
                    text: 'Exportar Excel'
                },
                {
                    extend: 'pdf',
                    text: 'Exportar PDF'
                },
                {
                    extend: 'print',
                    text: 'Imprimir'
                }
            ]
            ,
            pageLength: 50,
            language: {
                processing: "Procesando...",
                lengthMenu: "Mostrar _MENU_ registros",
                zeroRecords: "No se encontraron resultados",
                emptyTable: "Ningún dato disponible en esta tabla",
                info: "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
                infoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
                infoFiltered: "(filtrado de un total de _MAX_ registros)",
                search: "Buscar:",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior"
                }
            }
        });
    });



//----------------------------------------------------------------------------------------------GRAFICO COMBINADO HIGHCHARTS

async function createFilteredSalesChartHighcharts(data) {
    // Eliminar gráficos anteriores si es necesario
    if (Highcharts.charts.length > 0) {
        Highcharts.charts.forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
    }

    // Estructurar los datos por año y fecha
    const dataByYear = {};
    const avgPriceDataByYear = {}; // Para almacenar los precios promedio por año

    data.forEach(item => {
        const year = item.ano;
        const fecha = item.fecha;
        const timestamp = new Date(fecha).getTime(); // Convertir fecha a timestamp para el eje X
        const sales = item.suma_venta_unidades;
        const avgPrice = parseFloat(item.precio_promedio);

        // Inicializar el año en el objeto si no existe
        if (!dataByYear[year]) {
            dataByYear[year] = {};
            avgPriceDataByYear[year] = [];
        }

        // Guardar ventas para cada fecha
        if (!dataByYear[year][fecha]) {
            dataByYear[year][fecha] = {
                sales: 0,
                avgPriceSum: 0,
                avgPriceCount: 0,
                marca: item.marca,
                descripcion: item.descripcion,
                segmento: item.segmento,
                pet: item.pet
            };
        }

        // Acumular ventas y precios promedio
        dataByYear[year][fecha].sales += sales;
        dataByYear[year][fecha].avgPriceSum += avgPrice;
        dataByYear[year][fecha].avgPriceCount += 1;
    });

    // Crear series para Highcharts
    const series = Object.keys(dataByYear).flatMap(year => {
        const barData = [];
        const lineData = [];

        Object.keys(dataByYear[year]).forEach(fecha => {
            const timestamp = new Date(fecha).getTime();
            const { sales, avgPriceSum, avgPriceCount } = dataByYear[year][fecha];
            const avgPrice = avgPriceSum / avgPriceCount; // Calcular promedio real

            // Datos para las barras
            barData.push({
                x: timestamp,
                y: sales,
                extra: {
                    marca: dataByYear[year][fecha].marca,
                    descripcion: dataByYear[year][fecha].descripcion,
                    segmento: dataByYear[year][fecha].segmento,
                    pet: dataByYear[year][fecha].pet
                }
            });

            // Datos para las líneas
            lineData.push({
                x: timestamp,
                y: avgPrice
            });
        });

        return [
            {
                name: `Ventas ${year}`,
                data: barData,
                type: 'column',
                color: yearColors?.[year] || '#cccccc'
            },
            {
                name: `Precio Promedio ${year}`,
                data: lineData,
                type: 'line',
                yAxis: 1,
                color: year === "2023" ? '#FF0000' : '#0000FF'
            }
        ];
    });

    // Configuración del gráfico
    Highcharts.chart('ventasChartfiltered', {
        chart: {
            renderTo: 'ventasChartfiltered',
            height: '50%',
            zoomType: 'x'
        },
        title: {
            text: 'Ventas por Fecha y Precio Promedio'
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Fechas'
            },
            labels: {
                rotation: -90,
                style: {
                    fontSize: '11px'
                }
            }
        },
        yAxis: [
            { // Eje Y para ventas
                min: 0,
                title: {
                    text: 'Ventas en Unidades'
                }
            },
            { // Eje Y para precio promedio
                opposite: true,
                title: {
                    text: 'Precio Promedio (MXN)'
                },
                labels: {
                    formatter: function () {
                        return `$${this.value.toFixed(2)}`;
                    }
                }
            }
        ],
        tooltip: {
            shared: true,
            crosshairs: true,
            useHTML: true,
            formatter: function () {
                let tooltip = `<b>Fecha: ${Highcharts.dateFormat('%Y-%m-%d', this.x)}</b><br>`;
                this.points.forEach(point => {
                    const isPriceSeries = point.series.name.includes('Precio Promedio');
                    tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${isPriceSeries ? '$' + point.y.toFixed(2) : point.y}</b> ${isPriceSeries ? 'MXN' : 'unidades'}<br>`;
                });
                return tooltip;
            }
        },
        series: series,
        plotOptions: {
            column: {
                dataLabels: {
                    enabled: true,
                    style: {
                        fontSize: '10px'
                    },
                    formatter: function () {
                        return this.y;
                    }
                },
                pointPadding: 0.2,
                borderWidth: 0
            }
        }
    });
}



//--------------------------------------------configuracion de la pagina de inicio "resumen" tags y graficos

function showTab(event, tabId) {
    // Ocultar todas las pestañas
    var contents = document.querySelectorAll('.tab-content-item');
    contents.forEach(function(content) {
        content.style.display = 'none';
    });

    // Remover clase activa
    var tabs = document.querySelectorAll('.custom-tab-item');
    tabs.forEach(function(tab) {
        tab.classList.remove('active');
    });

    // Mostrar la pestaña seleccionada
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
}



  // Gráfico de Inventarios (Barras)
Highcharts.chart('inventario-chart', {
    chart: {
        type: 'bar' // Tipo de gráfico: barras
    },
    title: {
        text: 'Inventario Actual'
    },
    xAxis: {
        categories: ['Producto A', 'Producto B', 'Producto C', 'Producto D', 'Producto E'], // Categorías
        title: {
            text: 'Productos'
        }
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Unidades en Stock',
            align: 'high'
        }
    },
    tooltip: {
        valueSuffix: ' unidades'
    },
    series: [{
        name: 'Inventario',
        data: [10, 20, 30, 40, 50] // Datos de ejemplo
    }]
});

// Gráfico de Ventas (Líneas)
Highcharts.chart('ventas-chart', {
    chart: {
        type: 'line' // Tipo de gráfico: líneas
    },
    title: {
        text: 'Tendencia de Ventas'
    },
    xAxis: {
        categories: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'], // Categorías (meses)
        title: {
            text: 'Meses'
        }
    },
    yAxis: {
        title: {
            text: 'Ventas ($)'
        }
    },
    tooltip: {
        valuePrefix: '$'
    },
    series: [{
        name: 'Ventas',
        data: [100, 120, 150, 170, 200] // Datos de ejemplo
    }]
});

// Gráfico de Proveedores (Pastel)
Highcharts.chart('proveedores-chart', {
    chart: {
        type: 'pie' // Tipo de gráfico: pastel
    },
    title: {
        text: 'Proveedores Activos'
    },
    tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    accessibility: {
        point: {
            valueSuffix: '%'
        }
    },
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %'
            }
        }
    },
    series: [{
        name: 'Proveedores',
        colorByPoint: true,
        data: [{
            name: 'Proveedor A',
            y: 40
        }, {
            name: 'Proveedor B',
            y: 30
        }, {
            name: 'Proveedor C',
            y: 20
        }, {
            name: 'Proveedor D',
            y: 10
        }]
    }]
});


function showTab(event, tabId) {
    // Ocultar todas las pestañas
    var contents = document.querySelectorAll('.tab-content-item');
    contents.forEach(function(content) {
        content.style.display = 'none';
    });

    // Remover clase activa
    var tabs = document.querySelectorAll('.custom-tab-item');
    tabs.forEach(function(tab) {
        tab.classList.remove('active');
    });

    // Mostrar la pestaña seleccionada
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
}

