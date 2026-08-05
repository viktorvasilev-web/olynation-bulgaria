const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const form = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');
const thankYou = document.getElementById('thank-you');
const closeThankYou = document.getElementById('close-thank-you');
const quizStep1 = document.getElementById('quiz-step-1');
const quizStep2 = document.getElementById('quiz-step-2');
const quizNext = document.getElementById('quiz-next');
const quizBack = document.getElementById('quiz-back');
const quizCounter = document.getElementById('quiz-counter');
const quizProgressBar = document.getElementById('quiz-progress-bar');
const quizMessage = document.getElementById('quiz-message');

function setFormMessage(message) {
  formMessage.textContent = message;
}

function showQuizStep(step) {
  const isSecondStep = step === 2;
  quizStep1.hidden = isSecondStep;
  quizStep2.hidden = !isSecondStep;
  quizCounter.textContent = `${step} от 2`;
  quizProgressBar.style.width = isSecondStep ? '100%' : '50%';
  if (isSecondStep) document.getElementById('name').focus();
}

quizNext.addEventListener('click', () => {
  const selectedInterest = form.querySelector('input[name="interest"]:checked');
  if (!selectedInterest) {
    quizMessage.textContent = 'Моля, избери една от двете опции.';
    return;
  }
  quizMessage.textContent = '';
  showQuizStep(2);
});

quizBack.addEventListener('click', () => showQuizStep(1));

form.addEventListener('submit', event => {
  event.preventDefault();
  setFormMessage('');

  if (!form.reportValidity()) return;

  if (form.elements.website.value) return;

  if (!FORM_ENDPOINT) {
    setFormMessage('Формата все още не е свързана с Google таблицата.');
    return;
  }

  form.action = FORM_ENDPOINT;
  document.getElementById('form-source').value = window.location.href;
  HTMLFormElement.prototype.submit.call(form);

  form.reset();
  showQuizStep(1);
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
  if (event.key === 'Escape' && !thankYou.hidden) hideThankYou();
});
