const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const form = document.getElementById('therapy-form');
const formMessage = document.getElementById('form-message');
const submitButton = form?.querySelector('.submit-button');
const submitFrame = document.querySelector('iframe[name="therapy-submit-frame"]');
let submissionStarted = false;
let redirectFallback;

const openThankYouPage = () => {
  window.clearTimeout(redirectFallback);
  window.location.assign('/terapiq/thanks');
};

submitFrame?.addEventListener('load', () => {
  if (submissionStarted) openThankYouPage();
});

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
    submissionStarted = true;

    HTMLFormElement.prototype.submit.call(form);
    redirectFallback = window.setTimeout(openThankYouPage, 6000);
  });
}
