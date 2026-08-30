"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface Props {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  id: string;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

const TYPEAHEAD_RESET_MS = 700;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0 transition-transform duration-200"
      style={{ color: "var(--ink-faint)", transform: open ? "rotate(180deg)" : "none" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Select acessível com menu flutuante em `glass-strong` — substitui o `<select>`
 * nativo (cujo popup não é estilizável) mantendo o padrão ARIA de combobox:
 * o foco permanece no gatilho e a opção corrente é anunciada por
 * `aria-activedescendant`.
 */
export function SelectMenu({
  value,
  options,
  onChange,
  id,
  ariaLabel,
  placeholder = "Selecione…",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ query: "", at: 0 });
  const listId = `${useId().replace(/[:]/g, "")}-list`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  // Fecha ao clicar fora (mesmo padrão do autocomplete de cidade).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Mantém a opção corrente visível dentro do menu rolável.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const items = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    items?.[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const openMenu = (index: number) => {
    setActiveIndex(index >= 0 ? index : 0);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    closeMenu();
  };

  const findByPrefix = (char: string) => {
    const now = Date.now();
    const query =
      now - typeahead.current.at > TYPEAHEAD_RESET_MS ? char : typeahead.current.query + char;
    typeahead.current = { query, at: now };
    const from = activeIndex >= 0 ? activeIndex : selectedIndex;
    const rotated = options.map((_, i) => (from + 1 + i) % options.length);
    const match = rotated.find((i) => options[i].label.toLowerCase().startsWith(query));
    return match ?? -1;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) return;
    const last = options.length - 1;

    if (e.key === "Escape") {
      if (!open) return;
      e.preventDefault();
      e.stopPropagation(); // não fecha o Drawer que envolve o formulário
      closeMenu();
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openMenu(selectedIndex);
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => Math.min(last, Math.max(0, (i < 0 ? selectedIndex : i) + step)));
      return;
    }
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      if (!open) openMenu(e.key === "Home" ? 0 : last);
      else setActiveIndex(e.key === "Home" ? 0 : last);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) openMenu(selectedIndex);
      else commit(activeIndex);
      return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const found = findByPrefix(e.key.toLowerCase());
      if (found < 0) return;
      e.preventDefault();
      if (!open) commit(found);
      else setActiveIndex(found);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onClick={() => (open ? closeMenu() : openMenu(selectedIndex))}
        className="field flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 flex-1 truncate" style={{ color: selected ? "var(--ink)" : "var(--ink-faint)" }}>
          {selected ? (
            <>
              {selected.icon && <span aria-hidden="true">{selected.icon} </span>}
              {selected.label}
            </>
          ) : (
            placeholder
          )}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="glass-strong absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto p-1"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={option.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(i);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  background: isActive
                    ? "var(--chip-brand-bg-strong)"
                    : isSelected
                      ? "var(--chip-brand-bg)"
                      : "transparent",
                  color: isSelected || isActive ? "var(--chip-brand-fg)" : "var(--ink)",
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                {option.icon && <span aria-hidden="true">{option.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <span aria-hidden="true" style={{ color: "var(--accent)" }}>
                    ✓
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
