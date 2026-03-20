import React, { useState, useRef, useEffect } from 'react';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  label,
  options,
  value,
  onChange,
  required,
  placeholder = 'Type or select...',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Filter options by input (case-insensitive match on label)
  const filteredOptions = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return [...options].sort((a, b) => a.label.localeCompare(b.label));
    return options
      .filter(o => o.label.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [options, inputValue]);

  // Sync input display with selected value
  useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.label);
    } else {
      setInputValue('');
    }
  }, [value, selectedOption?.label]);

  // Keep highlighted index in bounds when filter changes
  useEffect(() => {
    setHighlightedIndex(i => Math.min(i, Math.max(0, filteredOptions.length - 1)));
  }, [filteredOptions.length]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (selectedOption) setInputValue(selectedOption.label);
        else setInputValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    setIsOpen(true);
    setHighlightedIndex(0);
    if (!v) onChange('');
  };

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.value);
    setInputValue(opt.label);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(i => {
          const next = Math.min(i + 1, filteredOptions.length - 1);
          listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(i => {
          const next = Math.max(i - 1, 0);
          listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) handleSelect(filteredOptions[highlightedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        if (selectedOption) setInputValue(selectedOption.label);
        else setInputValue('');
        break;
    }
  };

  return (
    <div ref={containerRef} className={`mb-4 relative ${className}`}>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">{label}</label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required && !value}
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm placeholder:text-slate-400"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2394a3b8%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
      />
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-56 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-3 text-slate-400 italic">No matches</li>
          ) : (
            filteredOptions.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`px-4 py-2.5 cursor-pointer transition-colors ${
                  i === highlightedIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'
                } ${opt.value === value ? 'font-semibold' : ''}`}
                onMouseEnter={() => setHighlightedIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
