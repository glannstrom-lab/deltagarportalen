/**
 * Simple Dropdown Menu Component
 * A lightweight dropdown menu without external dependencies
 *
 * TI3 (2026-09-02): primitiven hade noll aria-attribut — en skärmläsare hörde
 * bara "knapp", inget om att en meny fanns eller om den var öppen. Mönstret
 * är hämtat från NotificationBell.tsx (aria-haspopup/aria-expanded/
 * aria-controls på triggern) och WAI-ARIA APG:s menu-button-mönster
 * (role="menu"/"menuitem" på innehållet, eftersom varje DropdownMenuItem här
 * är en handling — inte en länk). Sex användningsställen ärver detta utan
 * att själva ändras.
 *
 * Fokus fångas via `onClick`s `event.currentTarget` i stället för
 * `React.cloneElement`-refar, eftersom triggerns barn ibland är
 * `components/ui/Button` — en vanlig funktionskomponent utan `forwardRef`.
 * En ref via cloneElement hade bara gett en varning och `null`.
 */
import React, { useState, useRef, useEffect, useId, useCallback, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Context for dropdown state
const DropdownContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  close: () => void
  closeAndFocusTrigger: () => void
  menuId: string
  setTriggerEl: (el: HTMLElement | null) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
  close: () => {},
  closeAndFocusTrigger: () => {},
  menuId: '',
  setTriggerEl: () => {},
})

// Root dropdown container
export function DropdownMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const triggerElRef = useRef<HTMLElement | null>(null)

  const close = () => setIsOpen(false)
  const closeAndFocusTrigger = useCallback(() => {
    setIsOpen(false)
    triggerElRef.current?.focus()
  }, [])
  const setTriggerEl = useCallback((el: HTMLElement | null) => {
    triggerElRef.current = el
  }, [])

  return (
    <DropdownContext.Provider
      value={{ isOpen, setIsOpen, close, closeAndFocusTrigger, menuId, setTriggerEl }}
    >
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

// Trigger element
export function DropdownMenuTrigger({
  children,
  asChild = false,
}: {
  children: ReactNode
  asChild?: boolean
}) {
  const { isOpen, setIsOpen, menuId, setTriggerEl } = useContext(DropdownContext)

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setTriggerEl(e.currentTarget)
    setIsOpen(!isOpen)
  }

  // Piltangent nedåt öppnar menyn och flyttar fokus in i den (samma mönster
  // som DropdownMenuContent nedan använder för att flytta fokus vid öppning).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault()
      setTriggerEl(e.currentTarget)
      setIsOpen(true)
    }
  }

  const ariaProps = {
    'aria-haspopup': 'menu' as const,
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
  }

  if (asChild) {
    // Clone the child element and add onClick + aria-attribut
    const child = children as React.ReactElement<Record<string, unknown>>
    return (
      <>
        {React.cloneElement(child, {
          onClick: handleClick,
          onKeyDown: handleKeyDown,
          ...ariaProps,
        })}
      </>
    )
  }

  return (
    <button onClick={handleClick} onKeyDown={handleKeyDown} type="button" {...ariaProps}>
      {children}
    </button>
  )
}

// Content container
export function DropdownMenuContent({
  children,
  align = 'end',
  className,
}: {
  children: ReactNode
  align?: 'start' | 'end' | 'center'
  className?: string
}) {
  const { isOpen, close, closeAndFocusTrigger, menuId } = useContext(DropdownContext)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAndFocusTrigger()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, close, closeAndFocusTrigger])

  // Flytta fokus in i menyn vid öppning (WAI-ARIA APG menu button-mönstret)
  // — annars vet en tangentbords-/skärmläsaranvändare inte att menyn finns.
  useEffect(() => {
    if (!isOpen) return
    const first = ref.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
    first?.focus()
  }, [isOpen])

  // Piltangenter flyttar fokus mellan menyalternativen (roving focus).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []
    )
    if (items.length === 0) return
    e.preventDefault()
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    const nextIndex =
      e.key === 'ArrowDown'
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length
    items[nextIndex]?.focus()
  }

  if (!isOpen) return null

  const alignmentClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 z-40" onClick={close} />
      <div
        ref={ref}
        id={menuId}
        role="menu"
        onKeyDown={handleKeyDown}
        className={cn(
          'absolute z-50 mt-1 bg-white dark:bg-stone-900 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 min-w-[180px]',
          alignmentClasses[align],
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

// Individual menu item
export function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  const { closeAndFocusTrigger } = useContext(DropdownContext)

  const handleClick = () => {
    if (disabled) return
    onClick?.()
    closeAndFocusTrigger()
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
        disabled
          ? 'text-stone-600 dark:text-stone-400 cursor-not-allowed'
          : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800',
        className
      )}
    >
      {children}
    </button>
  )
}

// Separator line
export function DropdownMenuSeparator() {
  return <div role="separator" className="h-px bg-stone-200 dark:bg-stone-700 my-1" />
}
