/**
 * React Performance Optimization Hooks
 * Collection of memoization hooks and utilities for optimal re-rendering
 */

import { useMemo, useCallback, memo, useRef, useEffect } from 'react';
import type { DependencyList } from 'react';

/**
 * Deep comparison for dependency arrays
 * Use when you need to compare objects/arrays by value, not reference
 */
export function useDeepCompareMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<DependencyList>([]);
  const signalRef = useRef(0);

  if (!deepEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, [signalRef.current]);
}

/**
 * Memoized callback with deep comparison dependencies
 */
export function useDeepCompareCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: DependencyList
): T {
  const ref = useRef<DependencyList>([]);
  const callbackRef = useRef(callback);

  if (!deepEqual(deps, ref.current)) {
    ref.current = deps;
    callbackRef.current = callback;
  }

  return useCallback((...args: Parameters<T>) => callbackRef.current(...args), []) as T;
}

/**
 * Simple deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * useMemo with proper typing for expensive calculations
 */
export function useComputed<T>(
  compute: () => T,
  deps: DependencyList,
  label?: string
): T {
  return useMemo(() => {
    if (label && process.env.NODE_ENV === 'development') {
      console.time(`[useComputed] ${label}`);
      const result = compute();
      console.timeEnd(`[useComputed] ${label}`);
      return result;
    }
    return compute();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Memoized selector hook for deriving data
 * Similar to reselect but for React components
 */
export function useSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  deps: DependencyList = []
): R {
  return useMemo(() => selector(data), [data, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hook to prevent expensive re-renders on rapidly changing values
 * Returns stable value that only updates after delay
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to track previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Performance monitoring hook for development
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render count: ${renderCount.current}`);
    }
  });

  return renderCount.current;
}

/**
 * Compare props for React.memo with custom comparison
 */
export function propsAreEqual<P>(
  prevProps: P,
  nextProps: P,
  ignoreKeys: (keyof P)[] = []
): boolean {
  const keys = Object.keys(prevProps) as (keyof P)[];
  
  for (const key of keys) {
    if (ignoreKeys.includes(key)) continue;
    if (!deepEqual(prevProps[key], nextProps[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Create a memoized component with deep prop comparison
 */
export function memoWithDeepCompare<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
): React.MemoExoticComponent<React.ComponentType<P>> {
  const Memoized = memo(Component, propsAreEqual);
  if (displayName) {
    Memoized.displayName = displayName;
  }
  return Memoized;
}

// Import React for useState
import React from 'react';

/**
 * Memoized list renderer for large lists
 * Only re-renders items that change
 */
export interface MemoizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  emptyComponent?: React.ReactNode;
}

export function MemoizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  emptyComponent
}: MemoizedListProps<T>) {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      key: keyExtractor(item, index),
      element: renderItem(item, index)
    }));
  }, [items, renderItem, keyExtractor]);

  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <div className={className}>
      {memoizedItems.map(({ key, element }) => (
        <MemoizedListItem key={key} item={element} />
      ))}
    </div>
  );
}

// Individual memoized item
interface MemoizedItemProps {
  item: React.ReactNode;
}

const MemoizedListItem = memo(function MemoizedListItem({ item }: MemoizedItemProps) {
  return <>{item}</>;
});

/**
 * Hook for virtualization of long lists
 * Only renders visible items
 */
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(itemCount, startIndex + visibleCount + overscan * 2);

    return {
      startIndex,
      endIndex,
      virtualHeight: itemCount * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [scrollTop, itemCount, itemHeight, containerHeight, overscan]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    ...virtualItems,
    onScroll
  };
}

export default {
  useDeepCompareMemo,
  useDeepCompareCallback,
  useComputed,
  useSelector,
  useDebouncedValue,
  usePrevious,
  useRenderCount,
  propsAreEqual,
  memoWithDeepCompare,
  MemoizedList,
  useVirtualization
};
