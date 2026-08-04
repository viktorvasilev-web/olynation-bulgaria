const CONTACTS_SHEET = 'Контакти';

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = event.parameter || {};

    if (data.website) {
      return jsonResponse({ ok: true });
    }

    const name = clean(data.name);
    const phone = clean(data.phone);
    const email = clean(data.email);
    const consent = clean(data.consent);
    const source = clean(data.source);

    if (!name || !phone || !email || !consent) {
      return jsonResponse({ ok: false, error: 'Missing required fields' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(CONTACTS_SHEET);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONTACTS_SHEET);
      sheet.appendRow(['Дата', 'Име', 'Телефон', 'Имейл', 'Съгласие', 'Източник']);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([new Date(), name, phone, email, 'Да', source]);
    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function clean(value) {
  return String(value || '').trim().slice(0, 2000);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
