const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const thankYou = document.getElementById('thank-you');
const closeThankYou = document.getElementById('close-thank-you');

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
    thankYou.hidden = false;
    document.body.style.overflow = 'hidden';
  });
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
