'use client';

import { useState, useRef, useEffect } from 'react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function toDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function Calendar({ value, onChange, placeholder = 'Select date' }) {
  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    onChange(toDateString(viewYear, viewMonth, day));
    setOpen(false);
  };

  const isSelected = (day) => value === toDateString(viewYear, viewMonth, day);
  const isToday = (day) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const displayValue = parsed
    ? parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="relative" ref={ref}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-left text-white focus:outline-none focus:ring-2 focus:ring-red-700 flex items-center justify-between"
      >
        <span className={displayValue ? 'text-white' : 'text-zinc-600'}>
          {displayValue || placeholder}
        </span>
        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4">

          {/* Month/Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <span className="font-bold text-white">{MONTHS[viewMonth]}</span>
              <span className="text-zinc-400 ml-2 text-sm">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-zinc-500 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const todayMark = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`
                    w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all
                    ${selected
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                      : todayMark
                      ? 'border border-red-700 text-red-400 hover:bg-zinc-800'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {value && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-xs text-zinc-500 hover:text-red-400 transition-colors"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
