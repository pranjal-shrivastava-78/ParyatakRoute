import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader2, Compass } from 'lucide-react';
import { destinationSearchService, AutocompleteItem } from '../services/destinationSearchService';

export interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string, item?: AutocompleteItem) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  required?: boolean;
  error?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export const DestinationAutocomplete: React.FC<DestinationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Where would you like to go?',
  id = 'destination-autocomplete',
  name = 'destination',
  autoFocus = false,
  error,
  className = '',
  style = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update suggestions on every keystroke
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    // Immediate local prefix search
    const localMatches = destinationSearchService.searchLocal(trimmed, 8);
    setSuggestions(localMatches);
    setIsOpen(true);
    setActiveIndex(-1);

    // If query has at least 2 chars, optionally trigger debounced remote enrichment
    if (trimmed.length >= 2) {
      setIsLoading(true);
      const timer = setTimeout(async () => {
        try {
          const remoteMatches = await destinationSearchService.searchWithRemoteFallback(
            trimmed,
            8,
            (updated) => {
              setSuggestions(updated);
            }
          );
          setSuggestions(remoteMatches);
        } finally {
          setIsLoading(false);
        }
      }, 250);

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: AutocompleteItem) => {
    onChange(`${item.name}, ${item.state ? `${item.state}, ` : ''}${item.country}`, item);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // Helper to highlight matching characters in name
  const renderHighlightedName = (name: string, query: string) => {
    if (!query.trim()) return name;
    const lowerName = name.toLowerCase();
    const lowerQuery = query.trim().toLowerCase();
    const matchIndex = lowerName.indexOf(lowerQuery);

    if (matchIndex === -1) {
      return name;
    }

    const before = name.slice(0, matchIndex);
    const match = name.slice(matchIndex, matchIndex + lowerQuery.length);
    const after = name.slice(matchIndex + lowerQuery.length);

    return (
      <>
        {before}
        <span style={{ color: 'var(--color-primary, #183D32)', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', ...style }}
      className={`destination-autocomplete-root ${className}`}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <MapPin
          size={18}
          style={{
            position: 'absolute',
            left: 14,
            color: 'var(--color-primary, #183D32)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.trim().length > 0 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-suggestions`}
          style={{
            width: '100%',
            padding: '12px 40px 12px 42px',
            backgroundColor: '#ffffff',
            border: error
              ? '1.5px solid var(--color-error, #D9383A)'
              : '1px solid var(--color-divider-gray, #D8D4C7)',
            borderRadius: 12,
            fontSize: 15,
            color: 'var(--color-text-primary, #26332E)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: isOpen ? '0 4px 14px rgba(24, 61, 50, 0.08)' : 'none',
          }}
          className="form-input destination-input"
        />

        <div
          style={{
            position: 'absolute',
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isLoading && (
            <Loader2
              size={16}
              style={{
                color: 'var(--color-graphite, #53635B)',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}

          {value && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: 'var(--color-graphite, #53635B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
              title="Clear input"
              aria-label="Clear destination"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

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

      {/* Intelligent Dropdown Suggestion Menu */}
      {isOpen && (
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-divider-gray, #D8D4C7)',
            borderRadius: 14,
            boxShadow: '0 12px 28px rgba(24, 61, 50, 0.12), 0 4px 8px rgba(0, 0, 0, 0.04)',
            maxHeight: 320,
            overflowY: 'auto',
            padding: '6px 0',
            margin: 0,
            listStyle: 'none',
            zIndex: 100,
          }}
        >
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => {
              const isSelected = index === activeIndex;
              return (
                <li
                  key={item.id}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? 'var(--color-primary-subtle, rgba(24, 61, 50, 0.06))'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '3px solid var(--color-primary, #183D32)'
                      : '3px solid transparent',
                    transition: 'background-color 0.15s, border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: isSelected
                          ? 'var(--color-primary, #183D32)'
                          : 'rgba(24, 61, 50, 0.05)',
                        color: isSelected ? '#ffffff' : 'var(--color-primary, #183D32)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background-color 0.15s, color 0.15s',
                      }}
                    >
                      <MapPin size={16} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--color-text-primary, #26332E)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {renderHighlightedName(item.name, value)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--color-graphite, #53635B)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.state ? `${item.state}, ` : ''}{item.country}
                      </span>
                    </div>
                  </div>

                  {item.category && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: 'var(--color-bg-alt, #E8E4D9)',
                        color: 'var(--color-primary, #183D32)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {item.category}
                    </span>
                  )}
                </li>
              );
            })
          ) : (
            <li
              style={{
                padding: '16px 20px',
                textAlign: 'center',
                color: 'var(--color-graphite, #53635B)',
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Compass size={22} style={{ color: 'var(--color-terracotta, #D97745)' }} />
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #26332E)' }}>
                No destinations found for "{value}"
              </span>
              <span style={{ fontSize: 12 }}>
                Try searching a popular city, state or attraction (e.g., Manali, Goa, Jaipur).
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default DestinationAutocomplete;
