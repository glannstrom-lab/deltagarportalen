/**
 * Skip Links Component for Accessibility
 * Allows keyboard users to skip to main content, navigation, or other sections
 * WCAG 2.4.1 Bypass Blocks - Level A
 */

import React from 'react';

interface SkipLink {
  id: string;
  label: string;
}

const defaultLinks: SkipLink[] = [
  { id: 'main-content', label: 'Hoppa till huvudinnehåll' },
  { id: 'main-navigation', label: 'Hoppa till navigation' },
  { id: 'search', label: 'Hoppa till sök' },
];

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

export function SkipLinks({ links = defaultLinks, className = '' }: SkipLinksProps) {
  return (
    <nav
      aria-label="Snabblänkar"
      className={`skip-links ${className}`}
    >
      <ul className="list-none m-0 p-0">
        {links.map((link) => (
          <li key={link.id} className="inline">
            <a
              href={`#${link.id}`}
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                         focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white
                         focus:rounded-lg focus:font-medium focus:shadow-lg
                         focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(link.id);
                if (element) {
                  element.focus();
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Helper component to mark main content area
interface MainContentProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function MainContent({ 
  children, 
  className = '', 
  id = 'main-content' 
}: MainContentProps) {
  return (
    <main
      id={id}
      tabIndex={-1}
      className={`outline-none ${className}`}
      aria-label="Huvudinnehåll"
    >
      {children}
    </main>
  );
}

// Helper to mark navigation landmarks
interface NavigationLandmarkProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  label?: string;
}

export function NavigationLandmark({ 
  children, 
  className = '', 
  id = 'main-navigation',
  label = 'Huvudnavigation'
}: NavigationLandmarkProps) {
  return (
    <nav
      id={id}
      className={className}
      aria-label={label}
    >
      {children}
    </nav>
  );
}

export default SkipLinks;
