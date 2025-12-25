import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';

interface RoleSelectProps {
  value: string | string[];
  options: string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  placeholder?: string;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({ value, options, onChange, multiple = false, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(option)) {
        onChange(current.filter(v => v !== option));
      } else {
        onChange([...current, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
    }
  };

  const removeValue = (v: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (Array.isArray(value)) {
      onChange(value.filter(item => item !== v));
    } else {
      onChange('');
    }
  };

  const isSelected = (option: string) => {
    if (multiple) {
        return Array.isArray(value) && value.includes(option);
    }
    return value === option;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Area */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-[42px] w-full p-2 border rounded-lg cursor-pointer flex flex-wrap gap-1.5 items-center transition-colors
            ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 dark:border-slate-600'} 
            bg-white dark:bg-slate-700 text-slate-900 dark:text-white`}
      >
        {(!value || (Array.isArray(value) && value.length === 0)) && (
            <span className="text-gray-400 dark:text-gray-400 text-sm">{placeholder || 'Select...'}</span>
        )}

        {/* Tags for Multi-Select */}
        {multiple && Array.isArray(value) && value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-xs font-medium px-2 py-1 rounded">
                {v}
                <button 
                    onClick={(e) => removeValue(v, e)}
                    className="hover:text-indigo-600 dark:hover:text-white focus:outline-none"
                >
                    <Icons.XMark className="w-3 h-3" />
                </button>
            </span>
        ))}

        {/* Text for Single Select */}
        {!multiple && typeof value === 'string' && value && (
            <span className="text-sm px-1">{value}</span>
        )}
        
        <div className="ml-auto">
            <Icons.ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">No people in roster.</div>
            ) : (
                options.map((option) => (
                    <div 
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors
                            ${isSelected(option) 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span>{option}</span>
                        {isSelected(option) && <Icons.CheckCircle className="w-4 h-4" />}
                    </div>
                ))
            )}
        </div>
      )}
    </div>
  );
};