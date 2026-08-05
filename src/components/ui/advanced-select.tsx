import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDownIcon as ChevronDown, XMarkIcon as X, CheckIcon as Check } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AdvancedSelectProps {
  /** applied to the inner text input so a <Label htmlFor> can bind to it */
  id?: string;
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onInputChange?: (value: string) => void;
  onRemove?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  /**
   * Optional manual override for max count. 
   * If not provided, it will auto-calculate based on width.
   */
  maxCount?: number;
}

const sizeClasses = {
  sm: 'min-h-8 text-sm px-2 py-1',
  md: 'min-h-10 text-sm px-3 py-2',
  lg: 'min-h-12 text-base px-4 py-3',
};

const chipSizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-sm px-2.5 py-1.5',
};

export function AdvancedSelect({
  id,
  options,
  value,
  onChange,
  onInputChange,
  onRemove,
  onClear,
  placeholder = 'Search...',
  multiple = false,
  size = 'md',
  disabled = false,
  className,
  maxCount: manualMaxCount,
}: AdvancedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // State for dynamic overflow
  const [visibleCount, setVisibleCount] = useState<number>(Number.MAX_SAFE_INTEGER);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const selectedValues = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerQuery));
  }, [options, query]);

  const handleSelect = useCallback((optionValue: string) => {
    if (multiple) {
      const newValue = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange?.(newValue);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
      setQuery('');
    }
  }, [multiple, selectedValues, onChange]);

  const handleRemove = useCallback((optionValue: string) => {
    const newValue = selectedValues.filter((v) => v !== optionValue);
    onChange?.(multiple ? newValue : '');
    onRemove?.(optionValue);
  }, [selectedValues, onChange, onRemove, multiple]);

  const handleClear = useCallback(() => {
    onChange?.(multiple ? [] : '');
    onClear?.();
    setQuery('');
  }, [onChange, onClear, multiple]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onInputChange?.(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredOptions[highlightedIndex]) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Backspace' && !query && selectedValues.length > 0) {
      handleRemove(selectedValues[selectedValues.length - 1]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Dynamic calculation of visible chips
  React.useLayoutEffect(() => {
    // If manual override is provided or not multiple, skip calculation
    if (manualMaxCount !== undefined || !multiple) {
      setVisibleCount(manualMaxCount ?? Number.MAX_SAFE_INTEGER);
      return;
    }

    if (!containerRef.current || !measureRef.current) return;

    const calculateVisibleIds = () => {
      const containerWidth = containerRef.current?.getBoundingClientRect().width || 0;
      // Reserve space for input (min 60px) + actions (~50px) + padding
      const reservedWidth = 120;
      const availableWidth = containerWidth - reservedWidth;

      let currentWidth = 0;
      let count = 0;
      const gap = 6; // gap-1.5 is 6px

      // Iterate through the ghost chips to measure real usage
      const ghostChips = measureRef.current?.children;
      if (!ghostChips) return;

      for (let i = 0; i < ghostChips.length; i++) {
        const chipWidth = ghostChips[i].getBoundingClientRect().width;
        // Check if adding this chip exceeds available width
        // We also need to consider the "+N" badge width if we cut off (approx 30px)
        // If it's the LAST one and it fits, good. 
        // If it doesn't fit, we need room for "+N".

        if (currentWidth + chipWidth > availableWidth) {
          break;
        }
        currentWidth += chipWidth + gap;
        count++;
      }

      setVisibleCount(count);
    };

    calculateVisibleIds();

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleIds();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [selectedValues, multiple, manualMaxCount, size]);

  const getOptionLabel = (val: string) => options.find((o) => o.value === val)?.label || val;

  // Determine which values to show
  const effectiveMaxCount = visibleCount;

  const visibleValues = multiple && selectedValues.length > effectiveMaxCount
    ? selectedValues.slice(0, effectiveMaxCount)
    : selectedValues;

  const hiddenCount = multiple && selectedValues.length > effectiveMaxCount
    ? selectedValues.length - effectiveMaxCount
    : 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Hidden measurement container (Ghost) */}
      {multiple && !manualMaxCount && (
        <div
          ref={measureRef}
          className={cn(
            'fixed opacity-0 pointer-events-none flex gap-1.5',
            sizeClasses[size] // Match padding/font size for accurate measure
          )}
          aria-hidden="true"
        >
          {selectedValues.map((val) => (
            <span
              key={val}
              className={cn(
                'inline-flex items-center gap-1 border', // match border width
                chipSizeClasses[size]
              )}
            >
              <span className="truncate max-w-[100px]">{getOptionLabel(val)}</span>
              <X className="w-3 h-3" />
            </span>
          ))}
          {/* Also measure a dummy +99 badge to ensure we reserve enough space? 
                     We are just using a fixed reservedWidth for simplicity + badge logic above
                  */}
        </div>
      )}

      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={cn(
          'flex flex-nowrap items-center gap-1.5 bg-background border border-input rounded-lg cursor-text transition-colors overflow-hidden',
          isOpen && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
          disabled && 'opacity-50 cursor-not-allowed',
          sizeClasses[size]
        )}
      >
        {/* Chips for selected values */}
        {multiple && visibleValues.map((val) => (
          <span
            key={val}
            className={cn(
              'inline-flex items-center gap-1 bg-primary/10 text-primary rounded-md border border-primary/20 shrink-0 animate-in fade-in zoom-in duration-200',
              chipSizeClasses[size]
            )}
          >
            <span className="truncate max-w-[100px]">{getOptionLabel(val)}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(val);
              }}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {hiddenCount > 0 && (
          <span
            className={cn(
              'inline-flex items-center justify-center bg-muted text-muted-foreground font-medium rounded-md shrink-0 animate-in fade-in zoom-in duration-200',
              chipSizeClasses[size]
            )}
          >
            +{hiddenCount}
          </span>
        )}

        {/* Single Select Display */}
        {!multiple && selectedValues.length === 1 && !query && (
          <span className="absolute left-3 text-sm text-foreground pointer-events-none truncate max-w-[calc(100%-40px)]">
            {getOptionLabel(selectedValues[0])}
          </span>
        )}

        {/* Input */}
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedValues.length === 0 ? placeholder : ''}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-[60px] bg-transparent outline-none placeholder:text-muted-foreground z-10",
            !multiple && selectedValues.length === 1 && !query && "caret-transparent text-transparent" // Hide cursor/text if overlaying
          )}
        />

        {/* Clear & Chevron */}
        <div className="flex items-center gap-1 shrink-0 ml-auto pl-1">
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto animate-scale-in">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No options found
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm text-start transition-colors',
                    index === highlightedIndex && 'bg-muted',
                    isSelected && 'text-primary font-medium',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
