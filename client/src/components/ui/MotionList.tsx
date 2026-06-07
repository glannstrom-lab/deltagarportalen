/**
 * MotionList — regisserad stagger-entré för listor och grids (LIV-ROADMAP Fas 2).
 *
 * Varje direkt barn wrappas i ett element med klassen `.stagger-item` (definierad
 * i index.css) som fadar upp med en liten växande delay per index. Wrapper-vägen
 * används medvetet så att primitiven funkar oavsett om barn-komponenten
 * vidarebefordrar className/style eller inte.
 *
 * DESIGN.md §11: animationen kör på `fadeInUp 0.3s` (= --motion-standard). Den
 * globala `prefers-reduced-motion`-regeln (index.css) kollapsar durationen och
 * `.stagger-item` nollar dessutom delayen — så reduced-motion-användare får
 * elementen direkt, utan successiv inkomst. Ingen framer-motion = auto-compliant.
 */
import { Children, isValidElement } from 'react'
import { cn } from '@/lib/utils'

interface MotionListProps {
  children: React.ReactNode
  /** Max antal element som får växande delay. Resten kommer in samtidigt. Default 8. */
  cap?: number
  className?: string
  /** Containerelement. Default 'div'. */
  as?: 'div' | 'ul' | 'ol'
  /** Extra klass på varje item-wrapper (t.ex. 'h-full' i grids med lika höjd). */
  itemClassName?: string
}

export function MotionList({
  children,
  cap = 8,
  className,
  as: Tag = 'div',
  itemClassName,
}: MotionListProps) {
  let index = -1
  return (
    <Tag className={className}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child
        index++
        return (
          <div
            className={cn('stagger-item', itemClassName)}
            style={{ '--stagger-index': Math.min(index, cap) } as React.CSSProperties}
          >
            {child}
          </div>
        )
      })}
    </Tag>
  )
}

export default MotionList
