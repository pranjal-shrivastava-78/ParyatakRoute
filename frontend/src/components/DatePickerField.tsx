import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DatePickerFieldProps {
  id: string;
  name?: string;
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  variant?: 'standard' | 'minimal';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Format ISO 'YYYY-MM-DD' into 'DD/MM/YYYY' for visual display
 */
export const formatToDDMMYYYY = (isoDate: string): string => {
  if (!isoDate || !isoDate.includes('-')) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  const [year, month, day] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

/**
 * Clickable DatePickerField component.
 * Clicking ANYWHERE inside the field (text, empty area, or calendar icon)
 * triggers the full calendar popover.
 */
export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'DD/MM/YYYY',
  error,
  required = false,
  className = '',
  variant = 'standard',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or minDate or today for initial calendar view month
  const getInitialViewDate = (): Date => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (minDate && /^\d{4}-\d{2}-\d{2}$/.test(minDate)) {
      const [y, m, d] = minDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  };

  const [viewDate, setViewDate] = useState<Date>(getInitialViewDate);

  // Sync viewDate when value or minDate changes
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  }, [value]);

  // Click outside listener to close calendar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  // Keyboard navigation for escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Build grid of days for viewMonth
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const days: { day: number; iso: string; isDisabled: boolean; isSelected: boolean; isToday: boolean }[] = [];

  const todayIso = new Date().toISOString().split('T')[0];

  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const iso = `${viewYear}-${mm}-${dd}`;

    const isBeforeMin = minDate ? iso < minDate : false;
    const isAfterMax = maxDate ? iso > maxDate : false;
    const isDisabled = isBeforeMin || isAfterMax;
    const isSelected = value === iso;
    const isToday = iso === todayIso;

    days.push({ day: d, iso, isDisabled, isSelected, isToday });
  }

  const handleDaySelect = (iso: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(iso);
    setIsOpen(false);
  };

  const displayFormatted = formatToDDMMYYYY(value);

  return (
    <div
      ref={containerRef}
      className={`date-picker-field-container ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary, #26332E)',
            marginBottom: 6,
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-terracotta, #D97745)' }}>*</span>}
        </label>
      )}

      {/* Entire box is clickable */}
      <div
        id={id}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: variant === 'minimal' ? '2px 0' : '12px 14px',
          borderRadius: variant === 'minimal' ? 0 : 12,
          border: variant === 'minimal'
            ? 'none'
            : error
            ? '1.5px solid var(--color-error, #D9383A)'
            : isOpen
            ? '1.5px solid var(--color-primary, #183D32)'
            : '1px solid var(--color-divider-gray, #D8D4C7)',
          backgroundColor: variant === 'minimal' ? 'transparent' : '#ffffff',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: variant === 'minimal' ? 'none' : isOpen ? '0 4px 14px rgba(24, 61, 50, 0.08)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: displayFormatted ? 600 : 400,
            color: displayFormatted
              ? 'var(--color-text-primary, #26332E)'
              : 'var(--color-graphite, #53635B)',
            letterSpacing: displayFormatted ? '0.04em' : 'normal',
          }}
        >
          {displayFormatted || placeholder}
        </span>

        {variant !== 'minimal' && (
          <CalendarIcon
            size={18}
            style={{
              color: 'var(--color-primary, #183D32)',
              flexShrink: 0,
              marginLeft: 8,
            }}
          />
        )}
      </div>

      {name && <input type="hidden" name={name} value={value} />}

      {error && (
        <p
          style={{
            color: 'var(--color-error, #D9383A)',
            fontSize: 12,
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          {error}
        </p>
      )}

      {/* Calendar Popup Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Calendar date picker"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-divider-gray, #D8D4C7)',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 12px 28px rgba(24, 61, 50, 0.16), 0 4px 10px rgba(0,0,0,0.04)',
            zIndex: 110,
            width: 290,
            minWidth: 280,
          }}
        >
          {/* Header with Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid var(--color-divider-gray, #E8E4D9)',
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 8,
                color: 'var(--color-primary, #183D32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-primary, #183D32)',
              }}
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 8,
                color: 'var(--color-primary, #183D32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Names */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-graphite, #53635B)',
              marginBottom: 8,
            }}
          >
            {DAYS_OF_WEEK.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
            }}
          >
            {/* Blank leading cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} style={{ height: 32 }} />
            ))}

            {/* Day buttons */}
            {days.map(({ day, iso, isDisabled, isSelected, isToday }) => (
              <button
                key={iso}
                type="button"
                disabled={isDisabled}
                onClick={(e) => !isDisabled && handleDaySelect(iso, e)}
                style={{
                  height: 32,
                  width: '100%',
                  borderRadius: 8,
                  border: isToday && !isSelected
                    ? '1.5px solid var(--color-terracotta, #D97745)'
                    : 'none',
                  backgroundColor: isSelected
                    ? 'var(--color-primary, #183D32)'
                    : isToday
                    ? 'rgba(217, 119, 69, 0.08)'
                    : 'transparent',
                  color: isSelected
                    ? '#ffffff'
                    : isDisabled
                    ? '#C5C0B4'
                    : isToday
                    ? 'var(--color-terracotta, #D97745)'
                    : 'var(--color-text-primary, #26332E)',
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : isToday ? 700 : 500,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled && !isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(24, 61, 50, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled && !isSelected) {
                    e.currentTarget.style.backgroundColor = isToday
                      ? 'rgba(217, 119, 69, 0.08)'
                      : 'transparent';
                  }
                }}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Quick Clear or Today Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              paddingTop: 8,
              borderTop: '1px solid var(--color-divider-gray, #E8E4D9)',
              fontSize: 12,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!minDate || todayIso >= minDate) {
                  onChange(todayIso);
                  setIsOpen(false);
                }
              }}
              disabled={minDate ? todayIso < minDate : false}
              style={{
                background: 'none',
                border: 'none',
                cursor: minDate && todayIso < minDate ? 'not-allowed' : 'pointer',
                color: minDate && todayIso < minDate ? '#C5C0B4' : 'var(--color-primary, #183D32)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              Today
            </button>

            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setIsOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-graphite, #53635B)',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerField;
