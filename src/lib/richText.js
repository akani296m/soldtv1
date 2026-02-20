const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

const ALLOWED_TAGS = new Set([
  'A',
  'B',
  'BR',
  'DIV',
  'EM',
  'H1',
  'H2',
  'H3',
  'I',
  'LI',
  'OL',
  'P',
  'STRONG',
  'U',
  'UL'
]);

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export function containsHtml(value = '') {
  return HTML_TAG_REGEX.test(String(value));
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(url = '') {
  try {
    const parsed = new URL(url, window.location.origin);
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

export function sanitizeRichTextHtml(value = '') {
  const input = String(value || '').trim();
  if (!input) return '';

  const withoutScripts = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return withoutScripts;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(withoutScripts, 'text/html');
  const elements = Array.from(doc.body.querySelectorAll('*'));

  for (const element of elements) {
    if (!element.parentNode) continue;

    const tag = element.tagName.toUpperCase();

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = element.parentNode;
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      continue;
    }

    const rawHref = element.getAttribute('href') || '';
    const attrs = Array.from(element.attributes);
    for (const attr of attrs) {
      element.removeAttribute(attr.name);
    }

    if (tag === 'A') {
      const href = sanitizeUrl(rawHref);
      if (href) {
        element.setAttribute('href', href);
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noopener noreferrer');
      } else {
        // If href is invalid, unwrap the link while keeping text.
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
    }
  }

  return doc.body.innerHTML.trim();
}

export function richTextToHtml(value = '') {
  const input = String(value || '').trim();
  if (!input) return '';

  if (containsHtml(input)) {
    return sanitizeRichTextHtml(input);
  }

  return escapeHtml(input).replace(/\n/g, '<br />');
}

export function richTextToPlainText(value = '') {
  const html = richTextToHtml(value);
  if (!html) return '';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
