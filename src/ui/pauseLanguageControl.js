import { getLanguage, onLanguageChange } from '../i18n/index.js';
import { playSfx, triggerHaptic } from '../core/audio.js';

let control = null;

export function initPauseLanguageControl() {
  if (control) return control;
  const widget = document.getElementById('pause-language-widget');
  const button = document.getElementById('pause-language-btn');
  const dropdown = document.getElementById('pause-language-dropdown');
  const select = document.getElementById('pause-language-select');
  if (!widget || !button || !dropdown || !select) return null;
  const options = [...dropdown.querySelectorAll('.lang-option-btn')];

  const close = () => {
    widget.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    dropdown.inert = true;
  };
  const open = () => {
    widget.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    dropdown.inert = false;
    playSfx('card_hover');
    triggerHaptic('light');
    if (typeof dropdown.scrollIntoView === 'function') {
      setTimeout(() => {
        dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 40);
    }
  };
  const update = () => {
    const language = getLanguage();
    select.value = language;
    options.forEach(option => {
      const selected = option.dataset.lang === language;
      option.classList.toggle('active', selected);
      option.setAttribute('aria-selected', String(selected));
      if (selected) {
        widget.querySelector('.lang-label-text').textContent = option.querySelector('.lang-opt-name').textContent;
        widget.querySelector('.lang-code-badge').textContent = option.querySelector('.lang-opt-badge').textContent;
      }
    });
  };

  button.addEventListener('click', () => {
    if (widget.classList.contains('is-open')) close();
    else open();
  });
  options.forEach(option => {
    option.addEventListener('click', () => {
      select.value = option.dataset.lang;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      playSfx('card_hover');
      triggerHaptic('light');
      close();
      button.focus();
    });
    option.addEventListener('mouseenter', () => playSfx('card_hover'));
  });
  document.addEventListener('pointerdown', event => {
    if (!widget.contains(event.target)) close();
  }, { passive: true });
  widget.addEventListener('focusout', event => {
    if (!widget.contains(event.relatedTarget)) close();
  });
  widget.addEventListener('keyup', event => event.stopPropagation());
  widget.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      button.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const wasOpen = widget.classList.contains('is-open');
      if (!wasOpen) open();
      let index = options.indexOf(document.activeElement);
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = options.length - 1;
      else if (index < 0) index = Math.max(0, options.findIndex(option => option.dataset.lang === getLanguage()));
      else index = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[index]?.focus();
    }
  });
  onLanguageChange(update);
  close();
  update();
  control = { close };
  return control;
}

export function closePauseLanguageControl() {
  control?.close();
}
