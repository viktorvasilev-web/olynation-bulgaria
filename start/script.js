const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbykZyGaWdLvG5A2b0si3fjSkng9I84b0nLLsWo9jzF0mtU_w8im2MftD7aJNR_4CNShIg/exec';

const thankYou = document.getElementById('thank-you');
const closeThankYou = document.getElementById('close-thank-you');
const thankYouMessage = thankYou.querySelector('p');
const orderModal = document.getElementById('order-modal');
const orderForm = document.getElementById('order-form');
const closeOrder = document.getElementById('close-order');
const sameDeliveryAddress = document.getElementById('same-delivery-address');
const registeredAddress = document.getElementById('order-registered-address');
const deliveryAddress = document.getElementById('order-delivery-address');

const PARTNER_PROFILES = {
  '/georgiochkov': {
    code: 'georgiochkov',
    name: 'Георги Очков',
    firstName: 'Георги',
    photo: 'georgi-ochkov-portrait.webp'
  }
};

const currentPath = window.location.pathname.replace(/\/+$/, '').toLowerCase();
const activePartner = PARTNER_PROFILES[currentPath] || null;
const partnerCode = activePartner ? activePartner.code : 'viktor';

document.querySelectorAll('[data-company-slider]').forEach(slider => {
  const slides = [...slider.querySelectorAll('[data-company-slide]')];
  const dots = [...slider.querySelectorAll('[data-company-dot]')];
  const previousButton = slider.querySelector('[data-company-prev]');
  const nextButton = slider.querySelector('[data-company-next]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = 0;
  let timer = null;
  let touchStartX = 0;

  function showCompanySlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle('is-active', isActive);
      if (isActive) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function stopCompanySlider() {
    window.clearInterval(timer);
    timer = null;
  }

  function startCompanySlider() {
    stopCompanySlider();
    if (!reducedMotion) {
      timer = window.setInterval(() => showCompanySlide(activeIndex + 1), 5500);
    }
  }

  previousButton.addEventListener('click', () => {
    showCompanySlide(activeIndex - 1);
    startCompanySlider();
  });
  nextButton.addEventListener('click', () => {
    showCompanySlide(activeIndex + 1);
    startCompanySlider();
  });
  dots.forEach(dot => dot.addEventListener('click', () => {
    showCompanySlide(Number(dot.dataset.companyDot));
    startCompanySlider();
  }));

  slider.addEventListener('mouseenter', stopCompanySlider);
  slider.addEventListener('mouseleave', startCompanySlider);
  slider.addEventListener('focusin', stopCompanySlider);
  slider.addEventListener('focusout', event => {
    if (!slider.contains(event.relatedTarget)) startCompanySlider();
  });
  slider.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].clientX;
    stopCompanySlider();
  }, { passive: true });
  slider.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) showCompanySlide(activeIndex + (distance < 0 ? 1 : -1));
    startCompanySlider();
  }, { passive: true });
  slider.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') previousButton.click();
    if (event.key === 'ArrowRight') nextButton.click();
  });

  showCompanySlide(0);
  startCompanySlider();
});

document.querySelectorAll('form').forEach(form => {
  const partnerField = document.createElement('input');
  partnerField.type = 'hidden';
  partnerField.name = 'partner';
  partnerField.value = partnerCode;
  form.appendChild(partnerField);
});

if (activePartner) {
  document.title = `${activePartner.name} | OlyNation партньорска програма`;

  const aboutTitle = document.getElementById('about-title');
  const aboutPhoto = document.querySelector('.about-photo-wrap img');
  const heroEyebrow = document.querySelector('.hero-inner > .eyebrow');

  if (aboutTitle) {
    aboutTitle.innerHTML = `<span aria-hidden="true">👋</span> Здравей! Аз съм ${activePartner.firstName}…`;
  }

  if (aboutPhoto) {
    aboutPhoto.src = activePartner.photo;
    aboutPhoto.alt = activePartner.name;
  }

  if (heroEyebrow) {
    heroEyebrow.textContent = `OlyNation партньорска програма с ${activePartner.name}`;
  }
}

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

    const selectedInterest = form.querySelector('input[name="interest"]:checked')?.value;
    const isPartnerProgram = selectedInterest === 'Повече информация за партньорската програма';

    form.action = FORM_ENDPOINT;
    form.elements.source.value = window.location.href;

    if (isPartnerProgram) {
      const submitFrame = document.querySelector('iframe[name="form-submit-frame"]');
      let hasRedirected = false;
      const redirectToPartnerProgram = () => {
        if (hasRedirected) return;
        hasRedirected = true;
        window.location.assign('https://www.oly.bg/start');
      };

      submitFrame?.addEventListener('load', redirectToPartnerProgram, { once: true });
      window.setTimeout(redirectToPartnerProgram, 4000);
    }

    HTMLFormElement.prototype.submit.call(form);

    form.reset();
    showQuizStep(1);

    if (isPartnerProgram) {
      submitMessage.textContent = 'Данните ти бяха изпратени. Пренасочваме те към партньорската програма…';
      return;
    }

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

function syncDeliveryAddress() {
  if (!sameDeliveryAddress.checked) return;
  deliveryAddress.value = registeredAddress.value;
}

sameDeliveryAddress.addEventListener('change', () => {
  deliveryAddress.readOnly = sameDeliveryAddress.checked;
  syncDeliveryAddress();
  if (!sameDeliveryAddress.checked) deliveryAddress.focus();
});

registeredAddress.addEventListener('input', syncDeliveryAddress);

orderForm.addEventListener('submit', event => {
  event.preventDefault();
  const message = orderForm.querySelector('.order-message');
  message.textContent = '';

  if (!orderForm.reportValidity()) return;
  if (orderForm.elements.website.value) return;

  const product = orderForm.elements.product.value;
  const quantity = orderForm.elements.quantity.value;
  const idNumber = orderForm.elements.id_number.value.trim();
  const permanentAddress = orderForm.elements.registered_address.value.trim();
  const shippingAddress = orderForm.elements.delivery_address.value.trim();

  orderForm.action = FORM_ENDPOINT;
  orderForm.elements.source.value = `ПОРЪЧКА | Продукт: ${product} | Количество: ${quantity} | Лична карта №: ${idNumber} | Постоянен адрес: ${permanentAddress} | Адрес за доставка: ${shippingAddress} | Страница: ${window.location.href}`;
  HTMLFormElement.prototype.submit.call(orderForm);

  orderForm.reset();
  orderForm.elements.quantity.value = '1';
  deliveryAddress.readOnly = false;
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
