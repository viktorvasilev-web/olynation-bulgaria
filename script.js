const SHEET_ID = '1S821JtStrzWv9RZFSsOMCvYYuRKT6wL2DYQ-jzbrD_8';
const BANNER_SHEET = 'Банер';
const LANGUAGES_SHEET = 'Езици';

const LANGUAGES = [
  { id: 'english', name: 'Английски', sheetName: 'English' },
  { id: 'french', name: 'Френски', sheetName: 'French' },
  { id: 'spanish-spain', name: 'Испански (Испания)', sheetName: 'Spanish Spain' },
  { id: 'spanish-mexico', name: 'Испански (Мексико)', sheetName: 'Spanish Mexico' },
  { id: 'italian', name: 'Италиански', sheetName: 'Italian' },
  { id: 'portuguese', name: 'Португалски', sheetName: 'Portuguese' },
  { id: 'german', name: 'Немски', sheetName: 'German' },
  { id: 'greek', name: 'Гръцки', sheetName: 'Greek' },
  { id: 'dutch', name: 'Нидерландски', sheetName: 'Dutch' },
  { id: 'russian', name: 'Руски', sheetName: 'Russian' },
  { id: 'swedish', name: 'Шведски', sheetName: 'Swedish' },
  { id: 'polish', name: 'Полски', sheetName: 'Polish' },
  { id: 'japanese', name: 'Японски', sheetName: 'Japanese' },
  { id: 'hebrew', name: 'Иврит', sheetName: 'Hebrew' },
  { id: 'norwegian', name: 'Норвежки', sheetName: 'Norwegian' },
  { id: 'danish', name: 'Датски', sheetName: 'Danish' },
  { id: 'hungarian', name: 'Унгарски', sheetName: 'Hungarian' },
];

let languageContents = [];

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

function tableToLanguageItems(table) {
  if (!table || !table.cols || !table.rows) return [];

  const headers = table.cols.map(col => normalize(col.label));
  const languageIndex = headers.indexOf('език');
  const contentIndex = headers.indexOf('съдържание');

  if (languageIndex === -1 || contentIndex === -1) return [];

  return table.rows.map(row => {
    const cells = row.c || [];
    const get = index => {
      if (index === -1 || !cells[index]) return '';
      return cells[index].f || cells[index].v || '';
    };

    return {
      language: normalize(get(languageIndex)),
      content: get(contentIndex),
    };
  }).filter(item => item.language && item.content);
}

async function loadBanner() {
  const banner = document.getElementById('promo-banner');
  if (!banner) return;

  try {
    const table = await loadSheetWithJsonp(BANNER_SHEET);
    const items = tableToItems(table);

    if (!items.length) {
      banner.style.display = 'none';
      return;
    }

    banner.textContent = items[0].title;
    banner.href = items[0].link;
    banner.style.display = 'block';
  } catch (err) {
    banner.style.display = 'none';
    console.error('Banner error:', err);
  }
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
  document.querySelectorAll('.copy-button[data-link]').forEach(button => {
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

function renderLanguages() {
  const list = document.getElementById('list-languages');
  const count = document.getElementById('count-languages');

  count.textContent = `${LANGUAGES.length} езика`;
  list.innerHTML = LANGUAGES.map(language => {
    const content = getLanguageContent(language);

    return `
      <div class="language-card">
        <span class="language-name">${escapeHTML(language.name)}</span>
        <button
          class="copy-button language-copy-button"
          type="button"
          data-language="${language.id}"
          aria-label="Копирай цялото съдържание за ${escapeHTML(language.name)}"
          title="Копирай цялото съдържание"
          ${content ? '' : 'disabled'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="3" stroke="currentColor" stroke-width="2"/>
            <rect x="4" y="4" width="11" height="11" rx="3" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.language-copy-button').forEach(button => {
    button.addEventListener('click', () => copyLanguageContent(button));
  });
}

function getLanguageContent(language) {
  const acceptedNames = [language.name, language.sheetName, language.id].map(normalize);
  const item = languageContents.find(entry => acceptedNames.includes(entry.language));
  return item?.content || '';
}

async function copyLanguageContent(button) {
  const language = LANGUAGES.find(item => item.id === button.dataset.language);
  const content = language ? getLanguageContent(language) : '';
  if (!content) return;
  const originalHTML = button.innerHTML;

  try {
    await navigator.clipboard.writeText(content);
    button.textContent = 'Копирано!';
    button.classList.add('copied');

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
    }, 1400);
  } catch (err) {
    button.textContent = 'Грешка';
    setTimeout(() => {
      button.innerHTML = originalHTML;
    }, 1400);
  }
}

async function loadLanguages() {
  try {
    const table = await loadSheetWithJsonp(LANGUAGES_SHEET);
    languageContents = tableToLanguageItems(table);
  } catch (err) {
    languageContents = [];
    console.info('Езиковите категории са готови; табът „Езици“ още не е наличен.');
  }

  renderLanguages();
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
  await loadBanner();
  await loadLanguages();

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
