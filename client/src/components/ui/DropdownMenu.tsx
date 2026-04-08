/**
 * Simple Dropdown Menu Component
 * A lightweight dropdown menu without external dependencies
 */
import React, { useState, useRef, useEffect, createContext, useContext, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Context for dropdown state
const DropdownContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  close: () => void
}>({
  isOpen: false,
  setIsOpen: () => {},
  close: () => {},
})

// Root dropdown container
export function DropdownMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, close }}>
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
  const { isOpen, setIsOpen } = useContext(DropdownContext)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  if (asChild) {
    // Clone the child element and add onClick
    const child = children as React.ReactElement
    return (
      <>
        {/* @ts-expect-error - cloneElement typing */}
        {React.cloneElement(child, { onClick: handleClick })}
      </>
    )
  }

  return (
    <button onClick={handleClick} type="button">
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
  const { isOpen, close } = useContext(DropdownContext)
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
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, close])

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
        className={cn(
          'absolute z-50 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[180px]',
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
  const { close } = useContext(DropdownContext)

  const handleClick = () => {
    if (disabled) return
    onClick?.()
    close()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
        disabled
          ? 'text-slate-400 cursor-not-allowed'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
        className
      )}
    >
      {children}
    </button>
  )
}

// Separator line
export function DropdownMenuSeparator() {
  return <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
}
