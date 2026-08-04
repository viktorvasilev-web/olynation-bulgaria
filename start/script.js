const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const form = document.getElementById('contact-form');
const submitButton = document.getElementById('submit-button');
const formMessage = document.getElementById('form-message');
const thankYou = document.getElementById('thank-you');
const closeThankYou = document.getElementById('close-thank-you');

function setFormMessage(message) {
  formMessage.textContent = message;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  setFormMessage('');

  if (!form.reportValidity()) return;

  if (form.elements.website.value) return;

  if (!FORM_ENDPOINT) {
    setFormMessage('Формата все още не е свързана с Google таблицата.');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Изпращане...';

  try {
    const data = new FormData(form);
    data.append('source', window.location.href);

    await fetch(FORM_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: data,
    });

    form.reset();
    thankYou.hidden = false;
    document.body.style.overflow = 'hidden';
  } catch (error) {
    setFormMessage('Възникна проблем при изпращането. Моля, опитай отново.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Изпрати запитване';
  }
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
  if (event.key === 'Escape' && !thankYou.hidden) hideThankYou();
});
