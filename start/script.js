const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const thankYou = document.getElementById('thank-you');
const closeThankYou = document.getElementById('close-thank-you');
const thankYouMessage = thankYou.querySelector('p');
const orderModal = document.getElementById('order-modal');
const orderForm = document.getElementById('order-form');
const closeOrder = document.getElementById('close-order');

document.querySelectorAll('.contact-quiz').forEach(quiz => {
  const form = quiz.querySelector('form');
  const steps = quiz.querySelectorAll('.quiz-step');
  const counter = quiz.querySelector('.quiz-progress > span');
  const progressBar = quiz.querySelector('.quiz-progress-track span');
  const nextButton = quiz.querySelector('.quiz-next');
  const backButton = quiz.querySelector('.quiz-back');
  const choiceMessage = steps[0].querySelector('.form-message');
  const submitMessage = steps[1].querySelector('.form-message');

  function showQuizStep(step) {
    const isSecondStep = step === 2;
    steps[0].hidden = isSecondStep;
    steps[1].hidden = !isSecondStep;
    counter.textContent = `${step} от 2`;
    progressBar.style.width = isSecondStep ? '100%' : '50%';
    if (isSecondStep) form.elements.name.focus();
  }

  nextButton.addEventListener('click', () => {
    const selectedInterest = form.querySelector('input[name="interest"]:checked');
    if (!selectedInterest) {
      choiceMessage.textContent = 'Моля, избери една от двете опции.';
      return;
    }
    choiceMessage.textContent = '';
    showQuizStep(2);
  });

  backButton.addEventListener('click', () => showQuizStep(1));

  form.addEventListener('submit', event => {
    event.preventDefault();
    submitMessage.textContent = '';

    if (!form.reportValidity()) return;
    if (form.elements.website.value) return;

    if (!FORM_ENDPOINT) {
      submitMessage.textContent = 'Формата все още не е свързана с Google таблицата.';
      return;
    }

    form.action = FORM_ENDPOINT;
    form.elements.source.value = window.location.href;
    HTMLFormElement.prototype.submit.call(form);

    form.reset();
    showQuizStep(1);
    thankYouMessage.textContent = 'Данните ти бяха изпратени успешно. Ще се свържа с теб възможно най-скоро.';
    thankYou.hidden = false;
    document.body.style.overflow = 'hidden';
  });
});

function openOrderForm(event) {
  event.preventDefault();
  orderModal.hidden = false;
  document.body.style.overflow = 'hidden';
  window.setTimeout(() => orderForm.elements.product.focus(), 0);
}

function hideOrderForm() {
  orderModal.hidden = true;
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-open-order]').forEach(button => {
  button.addEventListener('click', openOrderForm);
});

closeOrder.addEventListener('click', hideOrderForm);
orderModal.addEventListener('click', event => {
  if (event.target === orderModal) hideOrderForm();
});

orderForm.addEventListener('submit', event => {
  event.preventDefault();
  const message = orderForm.querySelector('.order-message');
  message.textContent = '';

  if (!orderForm.reportValidity()) return;
  if (orderForm.elements.website.value) return;

  const product = orderForm.elements.product.value;
  const quantity = orderForm.elements.quantity.value;
  const city = orderForm.elements.city.value.trim();
  const address = orderForm.elements.address.value.trim();

  orderForm.action = FORM_ENDPOINT;
  orderForm.elements.source.value = `ПОРЪЧКА | Продукт: ${product} | Количество: ${quantity} | Град: ${city} | Адрес: ${address} | Страница: ${window.location.href}`;
  HTMLFormElement.prototype.submit.call(orderForm);

  orderForm.reset();
  orderForm.elements.quantity.value = '1';
  hideOrderForm();
  thankYouMessage.textContent = 'Заявката ти за поръчка беше изпратена успешно. Ще се свържа с теб за потвърждение и следващите стъпки.';
  thankYou.hidden = false;
  document.body.style.overflow = 'hidden';
});

function hideThankYou() {
  thankYou.hidden = true;
  document.body.style.overflow = '';
}

closeThankYou.addEventListener('click', hideThankYou);
thankYou.addEventListener('click', event => {
  if (event.target === thankYou) hideThankYou();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!orderModal.hidden) hideOrderForm();
  else if (!thankYou.hidden) hideThankYou();
});
