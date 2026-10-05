const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const navLinks = [...document.querySelectorAll('.main-nav a')];
const revealElements = document.querySelectorAll('.reveal');
const form = document.querySelector('#contactForm');
const status = document.querySelector('#formStatus');
const year = document.querySelector('#year');

if (year) year.textContent = new Date().getFullYear();

menuToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => mainNav.classList.remove('open'));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

revealElements.forEach((element) => observer.observe(element));

const sections = [...document.querySelectorAll('main section[id]')];
const activateNav = () => {
  const y = window.scrollY + 140;
  let current = 'inicio';
  sections.forEach((section) => {
    if (y >= section.offsetTop) current = section.id;
  });
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
};
window.addEventListener('scroll', activateNav, { passive: true });
activateNav();

function setStatus(message, type = '') {
  status.textContent = message;
  status.className = `form-status ${type}`;
}

function toggleLoading(isLoading) {
  form.querySelector('.button-label').hidden = isLoading;
  form.querySelector('.button-loading').hidden = !isLoading;
  form.querySelector('button[type="submit"]').disabled = isLoading;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('');

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.consent = form.querySelector('[name="consent"]').checked;

  toggleLoading(true);

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message || 'Não foi possível enviar sua solicitação.', 'error');
      return;
    }

    setStatus(data.message || 'Solicitação registrada.', 'success');
    form.reset();

    if (data.whatsappUrl) {
      window.setTimeout(() => {
        window.location.href = data.whatsappUrl;
      }, 450);
    }
  } catch (error) {
    console.error(error);
    setStatus('Não foi possível conectar ao servidor. Verifique se a aplicação está em execução.', 'error');
  } finally {
    toggleLoading(false);
  }
});
