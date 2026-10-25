import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Turns "2026-10-24" or a full ISO string into a local "YYYY-MM-DD" key
const toKey = (value) => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value).slice(0, 10);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : keyOf(d.getFullYear(), d.getMonth(), d.getDate());
};

const DOT = {
    accepted: 'bg-emerald-500',
    completed: 'bg-blue-500',
    pending: 'bg-amber-500',
    declined: 'bg-red-400',
};

const Schedule = ({ bookings = [] }) => {
    const today = new Date();
    const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());
    const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [selected, setSelected] = useState(todayKey);

    const byDay = useMemo(() => {
        const map = {};
        bookings.forEach((b) => {
            const k = toKey(b.date);
            if (k) (map[k] ||= []).push(b);
        });
        return map;
    }, [bookings]);

    const { year, month } = cursor;
    const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
        new Date(year, month, 1)
    );
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
    const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    const shift = (delta) => {
        const d = new Date(year, month + delta, 1);
        setCursor({ year: d.getFullYear(), month: d.getMonth() });
    };
    const goToday = () => {
        setCursor({ year: today.getFullYear(), month: today.getMonth() });
        setSelected(todayKey);
    };

    const dayBookings = byDay[selected] || [];
    const selectedLabel = selected
        ? new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
              new Date(`${selected}T00:00:00`)
          )
        : '';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{monthLabel}</h3>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={goToday}
                        className={`h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${focusRing}`}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() => shift(-1)}
                        aria-label="Previous month"
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 ${focusRing}`}
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => shift(1)}
                        aria-label="Next month"
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 ${focusRing}`}
                    >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAYS.map((d) => (
                        <span key={d} className="pb-1 text-[11px] font-medium text-slate-500">
                            <span className="sm:hidden">{d[0]}</span>
                            <span className="hidden sm:inline">{d}</span>
                        </span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                        if (!day) return <span key={`e${i}`} />;
                        const k = keyOf(year, month, day);
                        const items = byDay[k] || [];
                        const isSelected = k === selected;
                        const isToday = k === todayKey;
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setSelected(k)}
                                aria-pressed={isSelected}
                                aria-label={`${day} ${monthLabel}${items.length ? `, ${items.length} booking${items.length > 1 ? 's' : ''}` : ''}`}
                                className={`relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors ${focusRing} ${
                                    isSelected
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : isToday
                                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                          : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {day}
                                {items.length > 0 && (
                                    <span className="absolute bottom-1.5 flex gap-0.5">
                                        {items.slice(0, 3).map((b, j) => (
                                            <span
                                                key={j}
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isSelected ? 'bg-white' : DOT[b.status] || DOT.pending
                                                }`}
                                            />
                                        ))}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-900">{selectedLabel}</p>
                {dayBookings.length === 0 ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        Nothing booked this day.
                    </p>
                ) : (
                    <ul className="mt-3 space-y-2">
                        {dayBookings.map((b, i) => (
                            <li key={b._id || i} className="rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="min-w-0 truncate text-sm font-semibold capitalize text-slate-900">
                                        {b.service || 'Service booking'}
                                    </p>
                                    <span className="flex shrink-0 items-center gap-1.5 text-xs capitalize text-slate-500">
                                        <span className={`h-2 w-2 rounded-full ${DOT[b.status] || DOT.pending}`} />
                                        {b.status}
                                    </span>
                                </div>
                                {b.time && (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                        {b.time}
                                    </p>
                                )}
                                {b.location && (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                        <span className="truncate">{b.location}</span>
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Schedule;