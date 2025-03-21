document.addEventListener('DOMContentLoaded', function(){
  window.addEventListener('pageshow', function(){
    var uid = sessionStorage.getItem('userId');
    if(uid){
      sessionStorage.removeItem('evaluationStarted_' + uid);
      sessionStorage.removeItem('startTime_' + uid);
      sessionStorage.removeItem('lastCompletedStep');
      sessionStorage.removeItem('attempts');
    }
  });
  sessionStorage.clear();
  var folioField = document.getElementById('folio'),
      dateField = document.getElementById('date'),
      timeField = document.getElementById('time'),
      lineaSelect = document.getElementById('linea'),
      partNumberSelect = document.getElementById('part-number'),
      estacionSelect = document.getElementById('estacion'),
      userIdField = document.getElementById('user-id'),
      userNameField = document.getElementById('user-name'),
      form = document.getElementById('login-form');
  var now = new Date();
  dateField.value = now.toLocaleDateString();
  timeField.value = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  var folio = sessionStorage.getItem('folio');
  if(!folio){
    folio = 'FOL-' + Date.now().toString(36).toUpperCase();
    sessionStorage.setItem('folio', folio);
  }
  folioField.textContent = folio;
  var partsData = {
    "LINEA 6": {
      "6LY0A": ["SUB1", "SUB2", "SUB3"]
    },
    "LINEA 8": {
      "6KH0A": ["SUB1"],
      "6KH0B": ["SUB1", "SUB2"],
      "6KH0C": ["SUB1"],
      "6KH0D": ["SUB1"],
      "6KH0E": ["SUB1"],
      "9WD0B": ["SUB1"],
      "9WD0E": ["SUB1"]
    }
  };
  function populateLineaSelect(){
    lineaSelect.innerHTML = '<option value="" disabled selected>Select Linea</option>';
    Object.keys(partsData).forEach(function(l){
      var opt = document.createElement('option');
      opt.value = l;
      opt.textContent = l;
      lineaSelect.appendChild(opt);
    });
  }
  function populatePartNumbers(linea){
    partNumberSelect.innerHTML = '<option value="" disabled selected>Select Part Number</option>';
    if(partsData[linea]){
      Object.keys(partsData[linea]).forEach(function(part){
        var opt = document.createElement('option');
        opt.value = part;
        opt.textContent = part;
        partNumberSelect.appendChild(opt);
      });
      partNumberSelect.disabled = false;
    } else {
      partNumberSelect.disabled = true;
    }
  }
  function populateEstaciones(linea, part){
    estacionSelect.innerHTML = '<option value="" disabled selected>Select Estacion</option>';
    if(partsData[linea] && partsData[linea][part]){
      partsData[linea][part].forEach(function(est){
        var opt = document.createElement('option');
        opt.value = est;
        opt.textContent = est;
        estacionSelect.appendChild(opt);
      });
      estacionSelect.disabled = false;
    } else {
      estacionSelect.disabled = true;
    }
  }
  populateLineaSelect();
  partNumberSelect.innerHTML = '<option value="" disabled selected>Select Part Number</option>';
  partNumberSelect.disabled = true;
  estacionSelect.innerHTML = '<option value="" disabled selected>Select Estacion</option>';
  estacionSelect.disabled = true;
  var savedUserId = sessionStorage.getItem('userId'),
      savedUserName = sessionStorage.getItem('userName'),
      savedLinea = sessionStorage.getItem('linea'),
      savedPartNumber = sessionStorage.getItem('partNumber'),
      savedEstacion = sessionStorage.getItem('estacion');
  if(savedUserId) userIdField.value = savedUserId;
  if(savedUserName) userNameField.value = savedUserName;
  if(savedLinea){
    lineaSelect.value = savedLinea;
    populatePartNumbers(savedLinea);
  }
  if(savedPartNumber && savedLinea){
    partNumberSelect.value = savedPartNumber;
    populateEstaciones(savedLinea, savedPartNumber);
  }
  if(savedEstacion){
    estacionSelect.value = savedEstacion;
  }
  userIdField.addEventListener('input', function(){
    this.value = this.value.replace(/\D/g, '');
    if(this.value.length === 6){
      var assoc = JSON.parse(localStorage.getItem('relojAssociations') || '{}');
      if(assoc[this.value]){
        userNameField.value = assoc[this.value];
      }
    }
  });
  lineaSelect.addEventListener('change', function(){
    populatePartNumbers(lineaSelect.value);
    estacionSelect.disabled = true;
  });
  partNumberSelect.addEventListener('change', function(){
    populateEstaciones(lineaSelect.value, partNumberSelect.value);
  });
form.addEventListener('submit', function(e){
  e.preventDefault();
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('userName');
  sessionStorage.removeItem('linea');
  sessionStorage.removeItem('partNumber');
  sessionStorage.removeItem('estacion');
  sessionStorage.removeItem('attempts');
  sessionStorage.setItem('userId', userIdField.value);
  sessionStorage.setItem('userName', userNameField.value);
  sessionStorage.setItem('linea', lineaSelect.value);
  sessionStorage.setItem('partNumber', partNumberSelect.value);
  sessionStorage.setItem('estacion', estacionSelect.value);
  sessionStorage.setItem('attempts', JSON.stringify({}));
  var associations = JSON.parse(localStorage.getItem('relojAssociations') || '{}');
  associations[userIdField.value] = userNameField.value;
  localStorage.setItem('relojAssociations', JSON.stringify(associations));
  var folderPath = lineaSelect.value.replace(' ', '_') + '/' + partNumberSelect.value.replace(/ /g, '_') + '/' + estacionSelect.value.toUpperCase() + '/PASO_1';
  var fileName = 'PASO_1.html';
  document.body.classList.add('fade-out');
  setTimeout(function(){
    window.location.href = folderPath + '/' + fileName;
  }, 1000);
});
});