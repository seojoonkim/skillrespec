// ═══════════════════════════════════════════════════════════
// Search Bar - Natural language fuzzy search for skills
// Refined glass morphism design
// ═══════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { theme, glass, glassElevated } from '../styles/theme';
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
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      className="relative w-full max-w-xs"
    >
      {/* Search Input */}
      <div 
        className="flex items-center gap-2 px-3 rounded-lg transition-all duration-150"
        style={{
          background: theme.colors.bgTertiary,
          border: `1px solid ${isFocused || isOpen ? theme.colors.accent : theme.colors.border}`,
          boxShadow: isFocused ? `0 0 0 3px ${theme.colors.accentSubtle}` : 'none',
        }}
      >
        {/* Search Icon */}
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isFocused ? theme.colors.accent : theme.colors.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 transition-colors duration-150"
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
          onFocus={() => {
            setIsFocused(true);
            results.length > 0 && setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none py-2 w-full"
          style={{
            color: theme.colors.textPrimary,
            fontSize: theme.fontSize.sm,
            fontFamily: theme.fonts.sans,
          }}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="p-1 rounded hover:bg-white/5 transition-colors duration-100"
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
          <kbd 
            className="shrink-0 px-1.5 py-0.5 rounded text-2xs font-mono"
            style={{
              background: theme.colors.bgSurface,
              color: theme.colors.textSubtle,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 animate-scale-in"
          style={{
            ...glassElevated,
          }}
        >
          <div className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={result.item.id}
                onClick={() => {
                  onSelectSkill?.(result.item.id);
                  setQuery(result.item.name);
                  setIsOpen(false);
                }}
                className="px-3 py-2.5 cursor-pointer transition-colors duration-100"
                style={{
                  background: index === selectedIndex 
                    ? theme.colors.bgActive 
                    : 'transparent',
                  borderBottom: index < results.length - 1 
                    ? `1px solid ${theme.colors.borderSubtle}` 
                    : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Skill Name */}
                    <div 
                      className="text-sm font-medium truncate"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {result.item.name}
                    </div>
                    
                    {/* Description */}
                    {result.item.description && (
                      <div 
                        className="text-xs truncate mt-0.5"
                        style={{ color: theme.colors.textMuted }}
                      >
                        {result.item.description}
                      </div>
                    )}
                  </div>

                  {/* Category Badge */}
                  <span 
                    className="shrink-0 px-2 py-0.5 rounded-full text-2xs font-medium"
                    style={{
                      color: theme.categoryColors[result.item.category] || theme.colors.textMuted,
                      background: `${theme.categoryColors[result.item.category]}15` || theme.colors.bgTertiary,
                    }}
                  >
                    {result.item.category}
                  </span>

                  {/* Match Score */}
                  <span 
                    className="shrink-0 font-mono text-2xs"
                    style={{ color: theme.colors.textSubtle }}
                  >
                    {Math.round(result.score * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div 
            className="px-3 py-2 flex justify-between items-center"
            style={{
              borderTop: `1px solid ${theme.colors.border}`,
              background: theme.colors.bgTertiary,
            }}
          >
            <span 
              className="text-2xs"
              style={{ color: theme.colors.textSubtle }}
            >
              {results.length} results
            </span>
            <div 
              className="flex gap-3 text-2xs"
              style={{ color: theme.colors.textSubtle }}
            >
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
