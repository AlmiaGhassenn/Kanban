import { useState, useRef, useEffect } from 'react';

export default function Select({ value, onChange, options, placeholder = 'Select...', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full gap-2 px-3 py-2 rounded-lg border text-sm transition appearance-none focus:outline-none focus:border-brand-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-200 light:bg-white light:border-slate-300 light:text-slate-700"
      >
        <span className={selected ? '' : 'text-slate-500'}>{selected?.label || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[140px] py-1 rounded-lg border shadow-lg z-50 animate-fade-in dark:bg-[#1a1a24] dark:border-white/10 light:bg-white light:border-slate-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm transition ${
                option.value === value
                  ? 'dark:bg-brand-500/20 dark:text-brand-400 light:bg-brand-50 light:text-brand-600'
                  : 'dark:text-slate-300 dark:hover:bg-white/5 light:text-slate-600 light:hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}