import { useState } from 'react';
import { fileUrl } from '../utils/fileUrl';

export default function Avatar({ path, name = '', size = 'h-12 w-12', text = 'text-base' }) {
    const [failed, setFailed] = useState(false);
    const url = fileUrl(path);
    const initials =
        name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

    if (!url || failed) {
        return (
            <div className={`${size} ${text} shrink-0 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center`}>
                {initials}
            </div>
        );
    }

    return (
        <img
            src={url}
            alt={name}
            loading="lazy"
            onError={() => setFailed(true)}
            className={`${size} shrink-0 rounded-full object-cover`}
        />
    );
}