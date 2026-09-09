import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  disabled?: boolean;
  variant?: 'dark' | 'light';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  disabled = false,
  variant = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const isDark = variant === 'dark';

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className} ${isOpen ? 'z-50' : 'z-10'}`} id={`custom-select-${value}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-1.5 border rounded text-xs transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isDark
            ? 'bg-surface-container hover:bg-surface-container-highest border-glass-stroke text-starlight-white focus:border-outline shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-100 shadow-sm'
        }`}
      >
        <span className="truncate pr-1 font-sans font-medium">{selectedOption?.label || ''}</span>
        <ChevronsUpDown className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-secondary' : 'text-slate-400'}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute right-0 mt-1.5 w-full min-w-[200px] border rounded-xl p-1.5 z-50 animate-scale-in origin-top-right focus:outline-none ${
            isDark
              ? 'bg-void-black/95 backdrop-blur-xl border-glass-stroke/80 shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
              : 'bg-white border-slate-200 shadow-[0_12px_28px_rgba(0,0,0,0.1)]'
          }`}
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar" role="listbox">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-primary-container/20 text-primary border border-primary-container/30 font-medium'
                        : 'bg-blue-50 text-blue-600 font-semibold'
                      : isDark
                        ? 'text-secondary hover:bg-white/10 hover:text-starlight-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-primary' : 'text-blue-600'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
