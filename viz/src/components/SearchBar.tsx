// ═══════════════════════════════════════════════════════════
// Search Bar - Natural language fuzzy search for skills
// ═══════════════════════════════════════════════════════════

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { theme } from '../styles/theme';
import { searchSkills, type SearchResult } from '../lib/search';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSelectSkill?: (skillId: string) => void;
  placeholder?: string;
}

export default function SearchBar({ 
  onSearch, 
  onSelectSkill,
  placeholder = 'Search skills...' 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    onSearch(value);
    
    if (value.trim().length >= 2) {
      const searchResults = searchSkills(value, 8);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [onSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelectSkill?.(results[selectedIndex].item.id);
          setIsOpen(false);
          setQuery(results[selectedIndex].item.name);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex, onSelectSkill]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  return (
    <div 
      ref={dropdownRef}
      style={{ 
        position: 'relative',
        width: '100%',
        maxWidth: '300px',
      }}
    >
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: theme.colors.bgTertiary,
        borderRadius: theme.radius.full,
        border: `1px solid ${isOpen ? theme.colors.accent : theme.colors.border}`,
        padding: '0 12px',
        transition: theme.transitions.fast,
      }}>
        {/* Search Icon */}
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={theme.colors.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.colors.textPrimary,
            fontSize: theme.fontSize.sm,
            fontFamily: theme.fonts.sans,
            padding: '8px 10px',
            width: '100%',
          }}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {!query && (
          <span style={{
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSubtle,
            background: theme.colors.bgHover,
            padding: '2px 6px',
            borderRadius: theme.radius.sm,
            fontFamily: theme.fonts.mono,
          }}>
            ⌘K
          </span>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadows.lg,
          overflow: 'hidden',
          zIndex: 1000,
        }}>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {results.map((result, index) => (
              <div
                key={result.item.id}
                onClick={() => {
                  onSelectSkill?.(result.item.id);
                  setQuery(result.item.name);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: index === selectedIndex 
                    ? theme.colors.bgActive 
                    : 'transparent',
                  borderBottom: index < results.length - 1 
                    ? `1px solid ${theme.colors.borderLight}` 
                    : 'none',
                  transition: theme.transitions.fast,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Skill Name */}
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      fontWeight: theme.fontWeight.medium,
                      color: theme.colors.textPrimary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {result.item.name}
                    </div>
                    
                    {/* Description */}
                    {result.item.description && (
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.textMuted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}>
                        {result.item.description}
                      </div>
                    )}
                  </div>

                  {/* Category Badge */}
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.categoryColors[result.item.category] || theme.colors.textMuted,
                    background: theme.colors.bgTertiary,
                    padding: '2px 8px',
                    borderRadius: theme.radius.full,
                    flexShrink: 0,
                  }}>
                    {result.item.category}
                  </span>

                  {/* Match Score */}
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textSubtle,
                    fontFamily: theme.fonts.mono,
                    flexShrink: 0,
                  }}>
                    {Math.round(result.score * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 14px',
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.textSubtle,
            }}>
              {results.length} results
            </span>
            <div style={{
              display: 'flex',
              gap: '8px',
              fontSize: theme.fontSize.xs,
              color: theme.colors.textSubtle,
            }}>
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
