const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const contactForm = document.getElementById('p90-contact-form');
const orderForm = document.getElementById('p90-order-form');
const orderModal = document.getElementById('order-modal');
const thankYou = document.getElementById('thank-you');
const thankYouMessage = thankYou.querySelector('p');

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

document.querySelectorAll('[data-open-order]').forEach(button => button.addEventListener('click', openOrder));
document.querySelector('[data-close-order]').addEventListener('click', closeOrder);
document.querySelector('[data-close-thank-you]').addEventListener('click', closeThankYou);

orderModal.addEventListener('click', event => {
  if (event.target === orderModal) closeOrder();
});

thankYou.addEventListener('click', event => {
  if (event.target === thankYou) closeThankYou();
});

contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const message = contactForm.querySelector('.form-message');
  message.textContent = '';

  if (!contactForm.reportValidity() || contactForm.elements.website.value) return;

  submitToSheet(contactForm, `P90 | Безплатно тестване | Страница: ${window.location.href}`);
  contactForm.reset();
  showThankYou('Заявката ти за безплатно тестване беше изпратена успешно. Ще се свържа с теб възможно най-скоро.');
});

orderForm.addEventListener('submit', event => {
  event.preventDefault();
  const message = orderForm.querySelector('.form-message');
  message.textContent = '';

  if (!orderForm.reportValidity() || orderForm.elements.website.value) return;

  const details = [
    'ПОРЪЧКА',
    'Продукт: THz Tera-P90 — USD 1,000*',
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
  showThankYou('Заявката ти за THz Tera-P90 беше изпратена успешно. Ще се свържа с теб за потвърждение и следващите стъпки.');
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!orderModal.hidden) closeOrder();
  else if (!thankYou.hidden) closeThankYou();
});
