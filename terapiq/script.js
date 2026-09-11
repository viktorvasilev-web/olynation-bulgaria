const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const form = document.getElementById('therapy-form');
const formMessage = document.getElementById('form-message');
const successMessage = document.getElementById('success-message');
const submitButton = form?.querySelector('.submit-button');

if (form) {
  form.action = FORM_ENDPOINT;

  form.addEventListener('submit', event => {
    event.preventDefault();
    formMessage.textContent = '';

    if (!form.reportValidity()) return;
    if (form.elements.website.value) return;

    form.elements.source.value = `ТЕРАПИЯ | Страница: ${window.location.href}`;
    submitButton.disabled = true;
    submitButton.textContent = 'Изпращане…';

    HTMLFormElement.prototype.submit.call(form);

    window.setTimeout(() => {
      form.hidden = true;
      document.querySelector('.form-heading').hidden = true;
      successMessage.hidden = false;
      successMessage.focus?.();
    }, 900);
  });
}
