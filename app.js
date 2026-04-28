// Простая SHA-256
async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

let pinSet = false;
let data = loadData();
let reserveData = loadReserveData();

document.addEventListener('DOMContentLoaded', () => {
  // Splash
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      checkPin();
    }, 500);
  }, 1000);

  // Кнопки PIN
  document.getElementById('submitPin').addEventListener('click', handlePin);
  // Открытие настроек
  document.getElementById('openSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'block';
  });
  // Закрытие настроек
  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
  });
  // Редактировать документы
  document.getElementById('editDocsBtn').addEventListener('click', openEditor);
  // Сохранить документы
  document.getElementById('saveDocsBtn').addEventListener('click', saveDocs);
  // Закрыть редактор
  document.getElementById('closeEditor').addEventListener('click', () => {
    document.getElementById('editorModal').style.display = 'none';
  });
  // Сменить PIN
  document.getElementById('changePinBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
    resetPin();
  });
  // Выйти
  document.getElementById('logoutBtn').addEventListener('click', () => {
    logout();
    document.getElementById('settingsModal').style.display = 'none';
  });

  // Закрытие детального просмотра документа
  document.getElementById('closeDocView').addEventListener('click', () => {
    document.getElementById('docViewModal').style.display = 'none';
  });

  // Открытие Резерв+
  document.getElementById('reservePlus').addEventListener('click', openReserve);
  // Закрытие Резерв+
  document.getElementById('closeReserve').addEventListener('click', () => {
    document.getElementById('reserveModal').style.display = 'none';
  });
  // Сохранить Резерв+
  document.getElementById('saveReserveBtn').addEventListener('click', saveReserve);
  // Удалить Резерв+
  document.getElementById('deleteReserveBtn').addEventListener('click', () => {
    localStorage.removeItem('reserveData');
    reserveData = {};
    document.getElementById('reserveModal').style.display = 'none';
    alert('Дані Резерв+ видалено');
  });

  // Остальные сервисы — просто заглушки
  document.getElementById('qrScanner').addEventListener('click', () => alert('Функція сканування QR-коду'));
  document.getElementById('eVorog').addEventListener('click', () => alert('Чат-бот єВорог запущено'));
  document.getElementById('unbreakablePoints').addEventListener('click', () => alert('Мапа Пунктів Незламності'));
  document.getElementById('warBonds').addEventListener('click', () => alert('Військові облігації'));
  document.getElementById('paidTaxes').addEventListener('click', () => alert('Сплачені податки'));

  // Превью фото
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

/* ========== PIN-код ========== */
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
    renderAll();
  } else {
    const storedHash = localStorage.getItem('pinHash');
    const inputHash = await sha256(pin);
    if (inputHash === storedHash) {
      document.getElementById('pinScreen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      renderAll();
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
}

/* ========== Данные ========== */
function loadData() {
  const raw = localStorage.getItem('diyaDocs');
  return raw ? JSON.parse(raw) : {};
}

function saveData() {
  localStorage.setItem('diyaDocs', JSON.stringify(data));
}

function loadReserveData() {
  const raw = localStorage.getItem('reserveData');
  return raw ? JSON.parse(raw) : {};
}

function saveReserveDataToStorage() {
  localStorage.setItem('reserveData', JSON.stringify(reserveData));
}

/* ========== Рендер главного экрана ========== */
function renderAll() {
  data = loadData();
  reserveData = loadReserveData();

  // Приветствие
  const name = data.fullName || 'Користувач';
  document.getElementById('greetingName').textContent = `Привіт, ${name}`;
  // Уведомление (имитация)
  document.getElementById('notification').style.display = 'flex';
  document.getElementById('notifText').textContent = 'Вам надійшов запит на підписання договору';

  // Документы
  const docsScroll = document.getElementById('documentsScroll');
  const birth = data.birthDate ? formatDate(data.birthDate) : '';
  const passport = data.passportNumber || 'XX000000';
  const id = data.idNumber || '000000000';
  const driver = data.driverNumber || 'ABC123456';
  const tax = data.taxNumber || '0000000000';

  docsScroll.innerHTML = `
    <div class="document-card" data-doc="passport">
      <div class="doc-card-icon">📘</div>
      <div class="doc-card-type">Паспорт громадянина України</div>
      <div class="doc-card-name">${name}</div>
      <div class="doc-card-details">${birth ? birth + ' • ' : ''}${passport}</div>
      <div class="doc-card-valid">Документ дійсний</div>
    </div>
    <div class="document-card" data-doc="idcard">
      <div class="doc-card-icon">🪪</div>
      <div class="doc-card-type">ID-картка</div>
      <div class="doc-card-name">${name}</div>
      <div class="doc-card-details">${birth ? birth + ' • ' : ''}${id}</div>
      <div class="doc-card-valid">Документ дійсний</div>
    </div>
    ${data.driverNumber ? `
    <div class="document-card" data-doc="driver">
      <div class="doc-card-icon">🚗</div>
      <div class="doc-card-type">Посвідчення водія</div>
      <div class="doc-card-name">${name}</div>
      <div class="doc-card-details">${birth ? birth + ' • ' : ''}${driver}</div>
      <div class="doc-card-valid">Документ дійсний</div>
    </div>` : ''}
    <div class="document-card" data-doc="tax">
      <div class="doc-card-icon">📄</div>
      <div class="doc-card-type">РНОКПП</div>
      <div class="doc-card-name">${name}</div>
      <div class="doc-card-details">${tax}</div>
      <div class="doc-card-valid">Дійсний</div>
    </div>
  `;

  // Клики по документам
  document.querySelectorAll('.document-card').forEach(card => {
    card.addEventListener('click', function() {
      const docType = this.dataset.doc;
      viewDocument(docType);
    });
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

/* ========== Открытие документа детально ========== */
function viewDocument(type) {
  data = loadData();
  const name = data.fullName || 'Користувач';
  const birth = data.birthDate ? formatDate(data.birthDate) : '';
  let title, number, extra = '';
  switch (type) {
    case 'passport':
      title = 'Паспорт громадянина України';
      number = data.passportNumber || 'XX000000';
      break;
    case 'idcard':
      title = 'ID-картка';
      number = data.idNumber || '000000000';
      break;
    case 'driver':
      title = 'Посвідчення водія';
      number = data.driverNumber || 'ABC123456';
      break;
    case 'tax':
      title = 'РНОКПП';
      number = data.taxNumber || '0000000000';
      break;
    default: return;
  }

  const qrText = btoa(JSON.stringify({ name, birth, number, type }));
  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrText}`;

  document.getElementById('docViewTitle').textContent = title;
  document.getElementById('docViewPhoto').innerHTML = data.photo
    ? `<img src="${data.photo}" style="width:120px;height:160px;object-fit:cover;border-radius:10px;">`
    : '';
  document.getElementById('docViewName').innerHTML = `<strong>ПІБ:</strong> ${name}`;
  document.getElementById('docViewBirth').innerHTML = `<strong>Дата народження:</strong> ${birth || '—'}`;
  document.getElementById('docViewNumber').innerHTML = `<strong>Номер:</strong> ${number}`;
  document.getElementById('docViewExtra').style.display = 'none';
  document.getElementById('docViewQR').src = qrURL;

  document.getElementById('docViewModal').style.display = 'block';
}

/* ========== Редактирование документов ========== */
function openEditor() {
  document.getElementById('settingsModal').style.display = 'none';
  const d = loadData();
  document.getElementById('fullNameInput').value = d.fullName || '';
  document.getElementById('birthDateInput').value = d.birthDate || '';
  document.getElementById('passportNumberInput').value = d.passportNumber || '';
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

function saveDocs() {
  const fullName = document.getElementById('fullNameInput').value;
  const birthDate = document.getElementById('birthDateInput').value;
  const passportNumber = document.getElementById('passportNumberInput').value;
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

  data = { fullName, birthDate, passportNumber, idNumber, taxNumber, driverNumber, photo };
  saveData();
  document.getElementById('editorModal').style.display = 'none';
  renderAll();
}

/* ========== Резерв+ ========== */
function openReserve() {
  reserveData = loadReserveData();
  document.getElementById('reserveName').value = reserveData.name || data.fullName || '';
  document.getElementById('reserveBirth').value = reserveData.birth || data.birthDate || '';
  document.getElementById('reserveRank').value = reserveData.rank || '';
  document.getElementById('reserveSpec').value = reserveData.spec || '';
  document.getElementById('reserveModal').style.display = 'block';
}

function saveReserve() {
  reserveData = {
    name: document.getElementById('reserveName').value,
    birth: document.getElementById('reserveBirth').value,
    rank: document.getElementById('reserveRank').value,
    spec: document.getElementById('reserveSpec').value
  };
  saveReserveDataToStorage();
  document.getElementById('reserveModal').style.display = 'none';
  alert('Дані Резерв+ збережено');
}
