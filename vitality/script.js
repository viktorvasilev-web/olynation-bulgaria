const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const orderForm = document.getElementById('p90-order-form');
const testingRegistrationForm = document.getElementById('testing-registration-form');
const testingAvailability = document.getElementById('testing-availability');
const orderModal = document.getElementById('order-modal');
const thankYou = document.getElementById('thank-you');
const thankYouMessage = thankYou.querySelector('p');
let testingEventDisplayDate = '';

function formatTestingDate(dateValue) {
  if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return '';
  const [year, month, day] = dateValue.split('-');
  return `${day}.${month}.${year}`;
}

function submitToSheet(form, source) {
  form.action = FORM_ENDPOINT;
  form.elements.source.value = source;
  HTMLFormElement.prototype.submit.call(form);
}

function showThankYou(message) {
  thankYouMessage.textContent = message;
  thankYou.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeThankYou() {
  thankYou.hidden = true;
  document.body.style.overflow = '';
}

function openOrder() {
  orderModal.hidden = false;
  document.body.style.overflow = 'hidden';
  window.setTimeout(() => orderForm.elements.name.focus(), 0);
}

function closeOrder() {
  orderModal.hidden = true;
  document.body.style.overflow = '';
}

window.receiveTestingStatus = status => {
  if (!status || !status.ok) {
    testingAvailability.textContent = 'Не успяхме да проверим местата. Можеш да изпратиш записването си.';
    return;
  }

  testingRegistrationForm.elements.event_date.value = status.eventDate;
  testingEventDisplayDate = status.displayDate || formatTestingDate(status.eventDate);
  testingAvailability.classList.toggle('is-full', status.currentWeekFull);
  testingAvailability.textContent = status.currentWeekFull
    ? `Тази седмица събитието е пълно. Записването е за следващото събитие на ${status.displayDate}.`
    : `Записване за ${status.displayDate}. Остават ${status.remaining} свободни места.`;
};

const testingStatusScript = document.createElement('script');
testingStatusScript.src = `${FORM_ENDPOINT}?action=testingStatus&callback=receiveTestingStatus`;
testingStatusScript.async = true;
testingStatusScript.onerror = () => {
  testingAvailability.textContent = 'Не успяхме да проверим местата. Можеш да изпратиш записването си.';
};
document.head.appendChild(testingStatusScript);

document.querySelectorAll('[data-open-order]').forEach(button => button.addEventListener('click', openOrder));
document.querySelector('[data-close-order]').addEventListener('click', closeOrder);
document.querySelector('[data-close-thank-you]').addEventListener('click', closeThankYou);

orderModal.addEventListener('click', event => {
  if (event.target === orderModal) closeOrder();
});

thankYou.addEventListener('click', event => {
  if (event.target === thankYou) closeThankYou();
});

testingRegistrationForm.addEventListener('submit', event => {
  event.preventDefault();
  const message = testingRegistrationForm.querySelector('.form-message');
  message.textContent = '';

  if (!testingRegistrationForm.reportValidity() || testingRegistrationForm.elements.website.value) return;

  const inviter = testingRegistrationForm.elements.inviter.value.trim();
  const eventDate = testingRegistrationForm.elements.event_date.value || 'автоматично избрана дата';
  const confirmedDate = testingEventDisplayDate || formatTestingDate(eventDate);
  submitToSheet(testingRegistrationForm, `Vitality Wand | Безплатно тестване | Дата: ${eventDate} | Поканен от: ${inviter} | Страница: ${window.location.href}`);
  testingRegistrationForm.reset();
  showThankYou(confirmedDate
    ? `Записването ти беше изпратено успешно. Очакваме те в понеделник, ${confirmedDate} г., между 18:45 и 18:55 ч.`
    : 'Записването ти беше изпратено успешно. Очакваме те между 18:45 и 18:55 ч. Датата е тази, показана във формата.');
});

orderForm.addEventListener('submit', event => {
  event.preventDefault();
  const message = orderForm.querySelector('.form-message');
  message.textContent = '';

  if (!orderForm.reportValidity() || orderForm.elements.website.value) return;

  const details = [
    'ПОРЪЧКА',
    'Продукт: OlyLife Vitality Wand — USD 600*',
    `Количество: ${orderForm.elements.quantity.value}`,
    `Лична карта №: ${orderForm.elements.id_number.value.trim()}`,
    `Постоянен адрес: ${orderForm.elements.registered_address.value.trim()}`,
    `Адрес за доставка: ${orderForm.elements.delivery_address.value.trim()}`,
    `Страница: ${window.location.href}`
  ].join(' | ');

  submitToSheet(orderForm, details);
  orderForm.reset();
  orderForm.elements.quantity.value = '1';
  closeOrder();
  showThankYou('Заявката ти за OlyLife Vitality Wand беше изпратена успешно. Ще се свържа с теб за потвърждение и следващите стъпки.');
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!orderModal.hidden) closeOrder();
  else if (!thankYou.hidden) closeThankYou();
});
