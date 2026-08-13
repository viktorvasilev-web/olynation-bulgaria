const CONTACTS_SHEET = 'Контакти';
const NOTIFICATION_EMAIL = 'viktorsfsl@gmail.com';
const PARTNER_EMAILS = {
  viktor: NOTIFICATION_EMAIL,
  georgiochkov: 'Georgi.ochkov@yahoo.de'
};

function testNotificationEmail() {
  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: 'Тестово известие от OlyNation',
    body: 'Имейл известията от формата работят успешно.'
  });

  console.log('Test email sent. Remaining daily quota: ' + MailApp.getRemainingDailyQuota());
}

function testGeorgiNotificationEmail() {
  MailApp.sendEmail({
    to: PARTNER_EMAILS.georgiochkov,
    subject: 'Тестово известие за страницата на Георги Очков',
    body: 'Имейл известията от oly.bg/georgiochkov работят успешно.'
  });

  console.log('Georgi test email sent. Remaining daily quota: ' + MailApp.getRemainingDailyQuota());
}

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
    const interest = clean(data.interest);
    const partner = clean(data.partner).toLowerCase() || 'viktor';

    if (interest.indexOf('Безплатно тестване на OlyLife уредите') === 0) {
      return registerBregalnitsaGuest(data, source, interest, partner);
    }

    if (!name || !phone || !email || !consent) {
      return jsonResponse({ ok: false, error: 'Missing required fields' });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(CONTACTS_SHEET);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONTACTS_SHEET);
      sheet.appendRow(['Дата', 'Име', 'Телефон', 'Имейл', 'Съгласие', 'Източник', 'Партньор']);
      sheet.setFrozenRows(1);
    }

    if (sheet.getRange(1, 7).getValue() !== 'Партньор') {
      sheet.getRange(1, 7).setValue('Партньор');
    }

    sheet.appendRow([new Date(), name, phone, email, 'Да', source, partner]);

    try {
      sendNotificationEmail({
        name: name,
        phone: phone,
        email: email,
        interest: interest,
        source: source,
        partner: partner
      });
    } catch (mailError) {
      console.error('Email notification failed: ' + mailError);
    }

    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function sendNotificationEmail(contact) {
  const recipientEmail = PARTNER_EMAILS[contact.partner] || NOTIFICATION_EMAIL;
  const isOrder = contact.source.indexOf('ПОРЪЧКА') === 0;
  const requestType = isOrder
    ? 'Поръчка на продукт'
    : (contact.interest || 'Общо запитване');
  const subject = isOrder
    ? 'Нова поръчка от сайта OlyNation'
    : 'Ново запитване от сайта OlyNation';

  const body = [
    subject,
    '',
    'Какво иска човекът: ' + requestType,
    'Име: ' + contact.name,
    'Телефон: ' + contact.phone,
    'Имейл: ' + contact.email,
    '',
    'Подробности:',
    contact.source
  ].join('\n');

  const htmlBody = [
    '<div style="font-family:Arial,sans-serif;max-width:680px;color:#17211d">',
    '<h2 style="color:#147a4c">' + escapeHtml(subject) + '</h2>',
    '<table style="width:100%;border-collapse:collapse">',
    emailRow('Какво иска човекът', requestType),
    emailRow('Име', contact.name),
    emailRow('Телефон', contact.phone),
    emailRow('Имейл', contact.email),
    emailRow('Подробности', contact.source),
    '</table>',
    '<p style="margin-top:18px;color:#617069;font-size:12px">Изпратено автоматично от oly.bg/start</p>',
    '</div>'
  ].join('');

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    replyTo: isValidEmail(contact.email) ? contact.email : recipientEmail
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function emailRow(label, value) {
  return '<tr>' +
    '<td style="width:180px;padding:10px;border-bottom:1px solid #e2e8e5;font-weight:bold;vertical-align:top">' + escapeHtml(label) + '</td>' +
    '<td style="padding:10px;border-bottom:1px solid #e2e8e5;white-space:pre-wrap">' + escapeHtml(value || '—') + '</td>' +
    '</tr>';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clean(value) {
  return String(value || '').trim().slice(0, 2000);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
