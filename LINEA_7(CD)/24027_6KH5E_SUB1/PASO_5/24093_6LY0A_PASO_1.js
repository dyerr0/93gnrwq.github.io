document.addEventListener('DOMContentLoaded', function() {
    // Aplicar la animación de entrada cuando la página se carga
    document.body.classList.add('fade-in');

    // Redirigir a otra página con una animación de salida
    function redirectWithTransition(url) {
        document.body.classList.add('fade-out');
        setTimeout(function() {
            window.location.href = url;
        }, 1000);
    }

    // Obtener datos del usuario desde URL o sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const userId   = urlParams.get('userId')   || sessionStorage.getItem('userId');
    const userName = urlParams.get('userName') || sessionStorage.getItem('userName');
    const folio    = sessionStorage.getItem('folio');
    const dateVal  = urlParams.get('date')     || new Date().toLocaleDateString();
    const timeVal  = urlParams.get('time')     || new Date().toLocaleTimeString();

    // Guardar fecha y hora para Power Automate
    sessionStorage.setItem('fechaPower', dateVal);
    sessionStorage.setItem('horaPower', timeVal);

    // Guardar el tiempo de término
    const endTime = Date.now();
    sessionStorage.setItem('endTime', endTime);

    // Verificar pasos completos en secuencia
    const currentFileName = window.location.pathname.split('/').pop();
    const stepIndex       = parseInt(currentFileName.match(/PASO_(\d+)/)[1], 10);
    const lastCompleted   = parseInt(sessionStorage.getItem('lastCompletedStep'), 10) || 0;
    if (stepIndex !== lastCompleted + 1) {
        redirectWithTransition(getLoginPath());
        return;
    }
    sessionStorage.setItem('lastCompletedStep', stepIndex);

    // Calcular tiempo transcurrido
    const startTime = parseInt(sessionStorage.getItem(`startTime_${userId}`), 10);
    const totalSec  = Math.floor((endTime - startTime) / 1000);
    const hrs       = Math.floor(totalSec / 3600);
    const mins      = Math.floor((totalSec % 3600) / 60);
    const secs      = totalSec % 60;
    const formattedTime = hrs > 0
        ? `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`
        : `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;

    // Calcular errores y resultado
    const attempts = JSON.parse(sessionStorage.getItem('attempts')) || {};
    let totalErrors = 0;
    Object.values(attempts).forEach(count => { if (count > 1) totalErrors += count - 1; });
    let resultado;
    if      (totalErrors === 0)  resultado = 'S+';
    else if (totalErrors === 1)  resultado = 'S';
    else if (totalErrors === 2)  resultado = 'A+';
    else if (totalErrors === 3)  resultado = 'A';
    else if (totalErrors === 4)  resultado = 'A-';
    else if (totalErrors === 5)  resultado = 'B+';
    else if (totalErrors === 6)  resultado = 'B';
    else if (totalErrors === 7)  resultado = 'B-';
    else if (totalErrors === 8)  resultado = 'C+';
    else if (totalErrors === 9)  resultado = 'C';
    else if (totalErrors === 10) resultado = 'C-';
    else if (totalErrors === 11) resultado = 'D+';
    else if (totalErrors === 12) resultado = 'D';
    else if (totalErrors === 13) resultado = 'D-';
    else                          resultado = 'F';

    // Mostrar datos en la interfaz
    document.getElementById('user-id').textContent    = userId;
    document.getElementById('user-name').textContent  = userName;
    document.getElementById('folio').textContent      = folio;
    document.getElementById('total-time').textContent = formattedTime;
    const resultadoEl = document.getElementById('resultado');
    resultadoEl.textContent = resultado;
    resultadoEl.classList.add('bounce-in');

    // Enviar solo la parte de Power Automate
    sendToPowerAutomate();

    // Al finalizar, generar CSV y redirigir
    document.getElementById('finalize-button').addEventListener('click', function() {
        generateCSV();
        sessionStorage.clear();
        redirectWithTransition(getLoginPath());
    });
});

function generateCSV() {
    const folio      = sessionStorage.getItem('folio');
    const userId     = sessionStorage.getItem('userId');
    const userName   = sessionStorage.getItem('userName');
    const linea      = sessionStorage.getItem('linea');
    const partNumber = sessionStorage.getItem('partNumber');
    const startTime  = parseInt(sessionStorage.getItem(`startTime_${userId}`), 10);
    const endTime    = parseInt(sessionStorage.getItem('endTime'), 10);
    const totalTime  = Math.floor((endTime - startTime) / 1000);
    const attempts   = JSON.parse(sessionStorage.getItem('attempts')) || {};

    let hours   = Math.floor(totalTime / 3600);
    let minutes = Math.floor((totalTime % 3600) / 60);
    let seconds = totalTime % 60;
    const formattedTime = hours > 0 
        ? `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}` 
        : `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;

    // Contenido CSV original
    let csvContent = "Folio,UserId,UserName,Linea,PartNumber";
    for (const step of Object.keys(attempts)) {
        csvContent += `,${step}`;
    }
    csvContent += ",TotalTime\n";
    csvContent += `${folio},${userId},${userName},${linea},${partNumber}`;
    for (const count of Object.values(attempts)) {
        csvContent += `,${count}`;
    }
    csvContent += `,${formattedTime}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${folio}_evaluation.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Lógica extra para Power Automate
function sendToPowerAutomate() {
    const payload = {
        Fecha:      sessionStorage.getItem('fechaPower'),
        Hora:       sessionStorage.getItem('horaPower'),
        Folio:      sessionStorage.getItem('folio'),
        UserId:     sessionStorage.getItem('userId'),
        UserName:   sessionStorage.getItem('userName'),
        Linea:      sessionStorage.getItem('linea'),
        PartNumber: sessionStorage.getItem('partNumber'),
        Estacion:   sessionStorage.getItem('estacion') || '',
        TotalTime:  document.getElementById('total-time').textContent
    };
    // Rellenar los pasos con guiones
    for (let i = 1; i <= 10; i++) {
        payload[`PASO_${i}`] = '-';
    }
    fetch('https://prod-62.japaneast.logic.azure.com:443/workflows/2cf8a8a35c1e437ba741d6eb00483a2d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=9LnciLruSLTaT2eL8_hiBdiLjGZFn53GYDv2ZhVPhT8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error('Error al enviar a Power Automate:', err));
}

// Obtener ruta de LOGIN.html
function getLoginPath() {
    const segments = window.location.pathname.split('/');
    // Ajustar -4 o -5 según nivel de carpetas
    return segments.slice(0, -4).join('/') + '/LOGIN.html';
}
