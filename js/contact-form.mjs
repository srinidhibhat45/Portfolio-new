/* Static HTML remains discoverable by Netlify and works without JavaScript. */
export function initContactForm(doc, {fetchImpl = globalThis.fetch, FormDataImpl = globalThis.FormData} = {}) {
  const form = doc.getElementById('contactForm');
  if (!form) return;
  const status = doc.getElementById('cfStatus');
  const toast = doc.getElementById('cfToast');
  const button = form.querySelector('.cf-submit');
  const label = form.querySelector('.cf-submit-txt');
  let sending = false, toastTimer;
  const message = (text, state = '') => {
    status.className = 'cf-status' + (state ? ' is-' + state : '');
    status.textContent = text;
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    const data = new FormDataImpl(form);
    if (data.get('bot-field')) return;
    data.set('form-name', form.name);
    sending = true;
    button.disabled = true;
    label.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    message('Sending your project brief…');
    if (toast) toast.classList.remove('is-visible');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetchImpl(form.getAttribute('action') || '/', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams(data).toString(),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      message('Message sent. I’ll get back to you soon.', 'ok');
      if (toast) {
        clearTimeout(toastTimer);
        toast.classList.add('is-visible');
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 5000);
      }
    } catch (error) {
      message(error.name === 'AbortError'
        ? 'The request timed out. Your brief is still here — try again, or email srinidhibhat45@gmail.com.'
        : 'Your message couldn’t be sent. Your brief is still here — try again, or email srinidhibhat45@gmail.com.', 'err');
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      label.textContent = 'Send message';
      form.setAttribute('aria-busy', 'false');
    }
  });
}
if (typeof document !== 'undefined') initContactForm(document);
