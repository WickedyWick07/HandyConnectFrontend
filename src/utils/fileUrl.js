const BASE = (import.meta.env.VITE_IMAGES_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// Turns whatever is stored in MongoDB ("/uploads/x.jpg", "uploads/x.jpg",
// or a full URL) into a working URL. Also repairs old https://localhost links.
export const fileUrl = (p) => {
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p.replace(/^https:\/\/localhost/i, 'http://localhost');
    return `${BASE}${p.startsWith('/') ? '' : '/'}${p}`;
};

const ext = (p) => (p || '').split('?')[0].toLowerCase();
export const isPdf = (p) => ext(p).endsWith('.pdf');
export const isImage = (p) => /\.(jpe?g|png|gif|webp|svg)$/.test(ext(p));

// Built-in placeholder, so no image file is needed in public/
export const PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e5e7eb"/><text x="100" y="108" font-size="14" text-anchor="middle" fill="#9ca3af" font-family="sans-serif">No image</text></svg>'
    );