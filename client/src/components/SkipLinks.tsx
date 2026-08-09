/* eslint-disable react-refresh/only-export-components -- resolveSkipTarget/focusSkipTarget hör ihop med länkarna som använder dem och testas direkt (UX32) */
/**
 * Skip Links Component for Accessibility
 * Allows keyboard users to skip to main content or navigation
 * WCAG 2.4.1 Bypass Blocks - Level A
 *
 * UX32 (2026-08-05): två av tre länkar pekade på id:n som aldrig fanns i DOM:en
 * (`main-navigation` bodde bara i hjälparen `NavigationLandmark`, som har noll
 * levande importörer, och `search` fanns ingenstans — portalen har ingen global
 * sökruta). En skip-länk som inte landar någonstans är värre än ingen alls.
 *
 * Tre saker ändrades:
 *  1. `search` är borttagen — det finns inget söklandmärke att hoppa till.
 *  2. `main-navigation` sätts nu på sidebarens <nav> (Sidebar.tsx). Mobilens
 *     HubBottomNav bär `data-skip-target="main-navigation"` i stället för ett
 *     dubblerat id, och resolvern nedan väljer den som faktiskt syns.
 *  3. Målet fokuseras även om det saknar `tabindex` (landningens
 *     `<section id="main-content">` gjorde `element.focus()` till en no-op).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface SkipLink {
  id: string;
  label: string;
}

const defaultLinks: SkipLink[] = [
  { id: 'main-content', label: 'Hoppa till huvudinnehåll' },
  { id: 'main-navigation', label: 'Hoppa till navigation' },
];

/** Element som redan tar emot fokus utan tabindex. */
const NATIVELY_FOCUSABLE = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

function isSkipTargetVisible(el: HTMLElement): boolean {
  // Element.checkVisibility finns i Chromium/WebKit/Firefox och är det enda
  // som ser display:none via CSS-klass. jsdom saknar det (och ger dessutom
  // alltid 0×0-rektanglar), därför fallbacken nedan — och därför att
  // resolvern aldrig får returnera null bara för att inget kunde mätas.
  const withCheck = el as HTMLElement & { checkVisibility?: () => boolean };
  if (typeof withCheck.checkVisibility === 'function') {
    return withCheck.checkVisibility();
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Hitta det element en skip-länk ska landa på.
 * Kandidater: `#<id>` samt alla `[data-skip-target="<id>"]`. Den första som
 * faktiskt syns vinner; kan ingen mätas används den första som finns.
 */
export function resolveSkipTarget(id: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const candidates: HTMLElement[] = [];
  const byId = document.getElementById(id);
  if (byId) candidates.push(byId);
  document
    .querySelectorAll<HTMLElement>(`[data-skip-target="${id}"]`)
    .forEach((el) => {
      if (!candidates.includes(el)) candidates.push(el);
    });
  if (candidates.length === 0) return null;
  return candidates.find(isSkipTargetVisible) ?? candidates[0];
}

/** Flytta fokus dit på riktigt — även om målet saknar tabindex. */
export function focusSkipTarget(el: HTMLElement): void {
  if (!el.hasAttribute('tabindex') && !NATIVELY_FOCUSABLE.has(el.tagName)) {
    el.setAttribute('tabindex', '-1');
  }
  el.focus({ preventScroll: true });
  if (typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

export function SkipLinks({ links = defaultLinks, className = '' }: SkipLinksProps) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('skipLinks.nav', 'Snabblänkar')}
      className={`skip-links ${className}`}
    >
      <ul className="list-none m-0 p-0">
        {links.map((link) => (
          <li key={link.id} className="inline">
            {/*
              F18 (2026-08-09): utseendet ägs av `.skip-links a` i
              accessibility.css — inte av utility-klasser här.
              Tidigare fanns TVÅ implementationer samtidigt: CSS-filens
              (`top: -100px` → `top: 0` vid fokus) och en uppsättning
              `sr-only focus:not-sr-only focus:top-4 …` på det här elementet.
              De konkurrerade, och eftersom accessibility.css ligger utanför
              Tailwinds lager vann filen alltid — utility-klasserna var död
              vikt som såg ut att styra något. Lägg inte tillbaka dem.
            */}
            <a
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                const element = resolveSkipTarget(link.id);
                if (element) focusSkipTarget(element);
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
  const { t } = useTranslation();
  return (
    <main
      id={id}
      tabIndex={-1}
      className={`outline-none ${className}`}
      aria-label={t('skipLinks.mainContent', 'Huvudinnehåll')}
    >
      {children}
    </main>
  );
}

// Helper to mark navigation landmarks.
//
// OBS (UX32, 2026-08-05): den här hjälparen har noll levande importörer —
// `main-navigation` sitter numera direkt på sidebarens <nav> (Sidebar.tsx).
// Börjar någon använda hjälparen igen: byt id, annars finns två element med
// samma id och skip-länken landar på fel ställe.
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
  label
}: NavigationLandmarkProps) {
  const { t } = useTranslation();
  return (
    <nav
      id={id}
      className={className}
      aria-label={label ?? t('skipLinks.mainNavigation', 'Huvudnavigation')}
    >
      {children}
    </nav>
  );
}

export default SkipLinks;
