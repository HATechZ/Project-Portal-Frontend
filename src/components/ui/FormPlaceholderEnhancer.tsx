import { useEffect } from 'react';

function applyPlaceholders() {
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea').forEach((field) => {
    if (field.placeholder || field.hasAttribute('aria-label')) return;
    const label = field.closest('label');
    const labelText = label?.querySelector('span')?.textContent?.replace(/\*/g, '').replace(/Optional/gi, '').trim();
    if (labelText) field.placeholder = `Enter ${labelText.toLowerCase()}`;
  });
}

export function FormPlaceholderEnhancer() {
  useEffect(() => {
    applyPlaceholders();
    const observer = new MutationObserver(applyPlaceholders);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
