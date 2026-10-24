import { fileUrl, isPdf, PLACEHOLDER } from '../utils/fileUrl';

// Shows an image, or a "View PDF" link if the file is a PDF.
// If an image fails to load, it swaps to the placeholder and never retries.
export default function FileThumb({ path, alt = '', className = '' }) {
    const url = fileUrl(path);

    if (isPdf(path)) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full h-60 border rounded bg-gray-50 text-sm font-medium text-purple-700 hover:bg-gray-100"
            >
                📄 View PDF
            </a>
        );
    }

    return (
        <img
            src={url || PLACEHOLDER}
            alt={alt}
            className={className}
            loading="lazy"
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER;
            }}
        />
    );
}