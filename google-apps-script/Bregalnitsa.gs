const BREGALNITSA_SHEET = 'Брегалница';
const BREGALNITSA_CAPACITY = 20;
const BREGALNITSA_TIME_ZONE = 'Europe/Sofia';

// Връща свободните места за най-близкото събитие.
function doGet(event) {
  const data = event && event.parameter ? event.parameter : {};

  if (data.action !== 'testingStatus') {
    return jsonResponse({ ok: false, error: 'Unknown action' });
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getBregalnitsaSheet(spreadsheet);
  const slot = findAvailableBregalnitsaSlot(sheet, new Date());
  const payload = {
    ok: true,
    eventDate: slot.dateKey,
    displayDate: slot.displayDate,
    remaining: BREGALNITSA_CAPACITY - slot.count,
    currentWeekFull: slot.weeksSkipped > 0
  };
  const callback = clean(data.callback).replace(/[^a-zA-Z0-9_.$]/g, '');

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return jsonResponse(payload);
}

// Записва посетителя за първия понеделник със свободно място.
function registerBregalnitsaGuest(data, source, interest, partner) {
  const name = clean(data.name);
  const inviter = clean(data.inviter);

  if (!name || !inviter) {
    return jsonResponse({ ok: false, error: 'Missing required fields' });
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getBregalnitsaSheet(spreadsheet);
  const slot = findAvailableBregalnitsaSlot(sheet, new Date());

  sheet.appendRow([
    new Date(),
    slot.dateKey,
    name,
    inviter,
    source,
    partner
  ]);

  try {
    sendNotificationEmail({
      name: name,
      phone: '',
      email: '',
      interest: interest,
      source: source + ' | Дата на събитието: ' + slot.displayDate + ' | Поканен от: ' + inviter,
      partner: partner
    });
  } catch (mailError) {
    console.error('Email notification failed: ' + mailError);
  }

  return jsonResponse({
    ok: true,
    eventDate: slot.dateKey,
    displayDate: slot.displayDate,
    remaining: BREGALNITSA_CAPACITY - slot.count - 1
  });
}

function getBregalnitsaSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(BREGALNITSA_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(BREGALNITSA_SHEET);
    sheet.appendRow(['Записване', 'Дата на събитието', 'Име', 'Поканен от', 'Източник', 'Партньор']);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function findAvailableBregalnitsaSlot(sheet, now) {
  let eventDate = getNextTestingMonday(now);
  let weeksSkipped = 0;

  while (weeksSkipped < 52) {
    const dateKey = Utilities.formatDate(eventDate, BREGALNITSA_TIME_ZONE, 'yyyy-MM-dd');
    const count = countBregalnitsaRegistrations(sheet, dateKey);

    if (count < BREGALNITSA_CAPACITY) {
      return {
        dateKey: dateKey,
        displayDate: Utilities.formatDate(eventDate, BREGALNITSA_TIME_ZONE, 'dd.MM.yyyy'),
        count: count,
        weeksSkipped: weeksSkipped
      };
    }

    eventDate.setDate(eventDate.getDate() + 7);
    weeksSkipped += 1;
  }

  throw new Error('No available testing date');
}

function getNextTestingMonday(now) {
  const localDate = new Date(
    Utilities.formatDate(now, BREGALNITSA_TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss")
  );
  const day = localDate.getDay();
  let daysUntilMonday = (8 - day) % 7;

  if (day === 1 && localDate.getHours() < 19) {
    daysUntilMonday = 0;
  } else if (daysUntilMonday === 0) {
    daysUntilMonday = 7;
  }

  localDate.setDate(localDate.getDate() + daysUntilMonday);
  localDate.setHours(19, 0, 0, 0);
  return localDate;
}

function countBregalnitsaRegistrations(sheet, dateKey) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  return sheet
    .getRange(2, 2, lastRow - 1, 1)
    .getDisplayValues()
    .reduce(function(total, row) {
      return total + (row[0] === dateKey ? 1 : 0);
    }, 0);
}
