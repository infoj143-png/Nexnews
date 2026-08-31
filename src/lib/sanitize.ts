import sanitize from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote',
  'strong', 'em', 'b', 'i', 'a', 'span', 'br'
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'target', 'rel', 'class'],
  'p': ['class'],
  'h2': ['class'],
  'h3': ['class'],
  'ul': ['class'],
  'ol': ['class'],
  'li': ['class'],
  'blockquote': ['class'],
  'strong': ['class'],
  'em': ['class'],
  'b': ['class'],
  'i': ['class'],
  'span': ['class'],
  'br': ['class']
};

export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  return sanitize(dirtyHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    disallowedTagsMode: 'discard',
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': sanitize.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }, false)
    }
  });
}
