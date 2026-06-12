const SHEET_ID = '1S821JtStrzWv9RZFSsOMCvYYuRKT6wL2DYQ-jzbrD_8';

const SECTIONS = [
  { id: 'backoffice', sheet: 'Бекофис', fallbackSheet: 'Бекофис Видеа', icon: '▶', action: 'Отвори' },
  { id: 'translations', sheet: 'Видеа', icon: '📖', action: 'Отвори' },
  { id: 'events', sheet: 'Събития', fallbackSheet: 'Събития на живо', icon: '🔴', action: 'Виж' },
  { id: 'resources', sheet: 'Ресурси', icon: '📁', action: 'Отвори' },
];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function isVisible(value) {
  const v = normalize(value);
  return !v || v === 'true' || v === 'да' || v === 'yes' || v === '1';
}

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

function loadSheetWithJsonp(sheetName) {
  return new Promise((resolve, reject) => {
    const callbackName = `sheetCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout while loading sheet'));
    }, 12000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = data => {
      cleanup();
      if (!data || data.status === 'error') {
        reject(new Error(data?.errors?.[0]?.detailed_message || 'Sheet error'));
        return;
      }
      resolve(data.table);
    };

    const url = new URL(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`);
    url.searchParams.set('sheet', sheetName);
    url.searchParams.set('tq', 'select *');
    url.searchParams.set('tqx', `responseHandler:${callbackName}`);

    script.onerror = () => {
      cleanup();
      reject(new Error('Could not load Google Sheet script'));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function tableToItems(table, isEvent = false) {
  if (!table || !table.cols || !table.rows) return [];

  const headers = table.cols.map(col => normalize(col.label));
  const titleIndex = headers.indexOf('заглавие');
  const linkIndex = headers.indexOf('линк');
  const visibleIndex = headers.indexOf('видим');
  const dateIndex = headers.indexOf('дата');

  if (titleIndex === -1 || linkIndex === -1) return [];

  return table.rows.map(row => {
    const cells = row.c || [];
    const get = index => {
      if (index === -1 || !cells[index]) return '';
      return cells[index].f || cells[index].v || '';
    };

    return {
      title: get(titleIndex),
      link: get(linkIndex),
      visible: visibleIndex === -1 ? true : isVisible(get(visibleIndex)),
      date: dateIndex === -1 ? '' : get(dateIndex),
      isEvent,
    };
  }).filter(item => item.title && item.link && item.visible);
}

async function loadSheet(section) {
  const names = [section.sheet, section.fallbackSheet].filter(Boolean);
  let lastError;

  for (const name of names) {
    try {
      const table = await loadSheetWithJsonp(name);
      return tableToItems(table, section.id === 'events');
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

async function copyText(button, link) {
  const originalHTML = button.innerHTML;

  try {
    await navigator.clipboard.writeText(link);

    button.classList.add('copied');
    button.textContent = 'Копирано!';

    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = originalHTML;
    }, 1400);
  } catch (err) {
    button.textContent = 'Грешка';

    setTimeout(() => {
      button.innerHTML = originalHTML;
    }, 1400);
  }
}

function setupCopyButtons() {
  document.querySelectorAll('.copy-button').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const link = button.dataset.link;
      copyText(button, link);
    });
  });
}

function render(section, items) {
  const list = document.getElementById(`list-${section.id}`);
  const count = document.getElementById(`count-${section.id}`);
  count.textContent = `${items.length} материала`;

  if (!items.length) {
    list.innerHTML = `<div class="empty">Все още няма добавени материали в този раздел.</div>`;
    return;
  }

  list.innerHTML = items.map(item => `
    <a class="card" href="${escapeHTML(item.link)}" target="_blank" rel="noopener noreferrer">
      <div>
        <p class="card-title">${section.icon} ${escapeHTML(item.title)}</p>
        <p class="card-meta">${item.date ? escapeHTML(item.date) + ' · ' : ''}Натисни, за да отвориш</p>
      </div>

      <button
        class="copy-button"
        type="button"
        aria-label="Копирай линка"
        title="Копирай линка"
        data-link="${escapeHTML(item.link)}"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="3" stroke="currentColor" stroke-width="2"/>
          <rect x="4" y="4" width="11" height="11" rx="3" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </a>
  `).join('');

  setupCopyButtons();
}

function renderError(section, err) {
  const list = document.getElementById(`list-${section.id}`);
  const count = document.getElementById(`count-${section.id}`);
  count.textContent = '';
  list.innerHTML = `<div class="error">Не мога да заредя този таб. Провери името на таба и дали таблицата е споделена за преглед.</div>`;
  console.error(section.sheet, err);
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.section;
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === button));
      document.querySelectorAll('.content-section').forEach(s => s.classList.toggle('active', s.id === target));
    });
  });
}

async function init() {
  setupTabs();
  for (const section of SECTIONS) {
    try {
      const items = await loadSheet(section);
      render(section, items);
    } catch (err) {
      renderError(section, err);
    }
  }
}

init();