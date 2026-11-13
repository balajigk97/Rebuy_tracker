'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { KNOWN_PLAYERS } from '@/lib/known-players';
import { cn } from '@/lib/utils';

interface PlayerNameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  id?: string;
  excludeNames?: string[];
}

export function PlayerNameInput({
  value,
  onChange,
  placeholder = 'Enter player name',
  className,
  autoFocus,
  id,
  excludeNames = [],
}: PlayerNameInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const excludeSet = new Set(excludeNames.map(n => n.toLowerCase()));

  const filtered = value.trim()
    ? KNOWN_PLAYERS.filter(
        name =>
          name.toLowerCase().includes(value.toLowerCase()) &&
          !excludeSet.has(name.toLowerCase())
      )
    : KNOWN_PLAYERS.filter(name => !excludeSet.has(name.toLowerCase()));

  const showDropdown = isOpen && filtered.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [value]);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const select = useCallback(
    (name: string) => {
      onChange(name);
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(i => (i < filtered.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(i => (i > 0 ? i - 1 : filtered.length - 1));
        break;
      case 'Enter':
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          e.preventDefault();
          select(filtered[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {filtered.map((name, i) => (
            <li
              key={name}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer',
                i === highlightIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              )}
              onMouseDown={e => {
                e.preventDefault();
                select(name);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
