async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

let pinSet = false;
let data = loadData();

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      checkPin();
    }, 500);
  }, 1000);

  document.getElementById('submitPin').addEventListener('click', handlePin);
  document.getElementById('openSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'block';
  });
  document.getElementById('editDocsBtn').addEventListener('click', openEditor);
  document.getElementById('saveDocsBtn').addEventListener('click', saveDocs);
  document.getElementById('changePinBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
    resetPin();
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').style.display = 'none';
    });
  });

  document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('photoPreview').innerHTML = `<img src="${ev.target.result}" alt="Фото">`;
      };
      reader.readAsDataURL(file);
    }
  });
});

async function checkPin() {
  const storedHash = localStorage.getItem('pinHash');
  const pinScreen = document.getElementById('pinScreen');
  const newPinHint = document.getElementById('newPinHint');
  if (storedHash) {
    pinSet = true;
    newPinHint.style.display = 'none';
  } else {
    pinSet = false;
    newPinHint.style.display = 'block';
  }
  pinScreen.style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

async function handlePin() {
  const pin = document.getElementById('pinInput').value;
  const error = document.getElementById('pinError');
  error.style.display = 'none';

  if (!pin || pin.length !== 4) return;

  if (!pinSet) {
    const hash = await sha256(pin);
    localStorage.setItem('pinHash', hash);
    pinSet = true;
    document.getElementById('pinScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    renderDocs();
  } else {
    const storedHash = localStorage.getItem('pinHash');
    const inputHash = await sha256(pin);
    if (inputHash === storedHash) {
      document.getElementById('pinScreen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      renderDocs();
    } else {
      error.textContent = 'Невірний PIN';
      error.style.display = 'block';
    }
  }
}

function resetPin() {
  localStorage.removeItem('pinHash');
  pinSet = false;
  document.getElementById('app').style.display = 'none';
  document.getElementById('pinScreen').style.display = 'flex';
  document.getElementById('newPinHint').style.display = 'block';
  document.getElementById('pinInput').value = '';
}

function logout() {
  resetPin();
  document.getElementById('settingsModal').style.display = 'none';
}

function loadData() {
  const raw = localStorage.getItem('diyaDocs');
  return raw ? JSON.parse(raw) : {};
}

function saveDataToStorage() {
  localStorage.setItem('diyaDocs', JSON.stringify(data));
}

function renderDocs() {
  data = loadData();
  const list = document.getElementById('documentsList');
  const name = data.fullName || 'Прізвище Ім\'я';
  const birth = data.birthDate ? formatDate(data.birthDate) : '01.01.2000';
  const id = data.idNumber || '000000000';
  const tax = data.taxNumber || '0000000000';
  const driver = data.driverNumber || 'ABC123456';

  list.innerHTML = `
    <div class="document-card" id="passportCard">
      <div class="card-inner">
        <div class="card-type">ID-картка</div>
        <div class="card-name">${name}</div>
        <div class="card-details"><span>${birth}</span><span class="separator">•</span><span>${id}</span></div>
      </div>
      <div class="card-icon">🪪</div>
    </div>
    <div class="document-card" id="taxCard">
      <div class="card-inner">
        <div class="card-type">РНОКПП (ІПН)</div>
        <div class="card-name">${name}</div>
        <div class="card-details"><span>${tax}</span></div>
      </div>
      <div class="card-icon">📄</div>
    </div>
    <div class="document-card" id="driverLicenseCard">
      <div class="card-inner">
        <div class="card-type">Посвідчення водія</div>
        <div class="card-name">${name}</div>
        <div class="card-details"><span>${birth}</span><span class="separator">•</span><span>${driver}</span></div>
      </div>
      <div class="card-icon">🚗</div>
    </div>`;

  document.getElementById('passportCard').onclick = () => viewDoc('ID-картка');
  document.getElementById('taxCard').onclick = () => viewDoc('РНОКПП');
  document.getElementById('driverLicenseCard').onclick = () => viewDoc('Посвідчення водія');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function viewDoc(type) {
  const d = loadData();
  const qrText = btoa(JSON.stringify(d));
  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrText}`;
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content doc-view">
      <span class="close-btn">&times;</span>
      <h2>${type}</h2>
      <div style="margin:16px 0;">
        <img src="${d.photo || 'icon-192.png'}" style="width:120px;height:160px;object-fit:cover;border-radius:10px;" alt="Фото">
      </div>
      <p><strong>ПІБ:</strong> ${d.fullName || '—'}</p>
      <p><strong>Дата народження:</strong> ${d.birthDate ? formatDate(d.birthDate) : '—'}</p>
      <p><strong>Номер:</strong> ${type==='ID-картка'?d.idNumber:(type==='РНОКПП'?d.taxNumber:d.driverNumber)}</p>
      <div style="margin-top:20px;text-align:center;">
        <img src="${qrURL}" alt="QR-код" style="background:#fff;padding:10px;border-radius:10px;">
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.close-btn').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function openEditor() {
  document.getElementById('settingsModal').style.display = 'none';
  const d = loadData();
  document.getElementById('fullNameInput').value = d.fullName || '';
  document.getElementById('birthDateInput').value = d.birthDate || '';
  document.getElementById('idNumberInput').value = d.idNumber || '';
  document.getElementById('taxNumberInput').value = d.taxNumber || '';
  document.getElementById('driverNumberInput').value = d.driverNumber || '';
  const preview = document.getElementById('photoPreview');
  if (d.photo) {
    preview.innerHTML = `<img src="${d.photo}" alt="Фото">`;
  } else {
    preview.innerHTML = '';
  }
  document.getElementById('editorModal').style.display = 'block';
}

async function saveDocs() {
  const fullName = document.getElementById('fullNameInput').value;
  const birthDate = document.getElementById('birthDateInput').value;
  const idNumber = document.getElementById('idNumberInput').value;
  const taxNumber = document.getElementById('taxNumberInput').value;
  const driverNumber = document.getElementById('driverNumberInput').value;
  const photoInput = document.getElementById('photoInput');
  let photo = data.photo || null;
  if (photoInput.files && photoInput.files[0]) {
    photo = URL.createObjectURL(photoInput.files[0]);
  } else {
    const img = document.querySelector('#photoPreview img');
    if (img) photo = img.src;
  }

  data = { fullName, birthDate, idNumber, taxNumber, driverNumber, photo };
  saveDataToStorage();
  document.getElementById('editorModal').style.display = 'none';
  renderDocs();
}
