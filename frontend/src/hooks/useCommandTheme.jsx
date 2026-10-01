import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

export const THEME_STORAGE_KEY = 'gamun-command-theme';

const EASE = [0.22, 1, 0.36, 1];

const THEMES = [
  {
    id: 'light',
    label: 'Light',
    icon: 'bi-sun',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: 'bi-moon-stars',
  },
];

const isTheme = (value) =>
  THEMES.some((theme) => theme.id === value);

function readInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const stored = window.localStorage.getItem(
      THEME_STORAGE_KEY
    );

    if (isTheme(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable.
  }

  return window.matchMedia?.(
    '(prefers-color-scheme: dark)'
  ).matches
    ? 'dark'
    : 'light';
}

export function useCommandTheme() {
  const [theme, setThemeState] = useState(readInitialTheme);

  const setTheme = useCallback((next) => {
    if (!isTheme(next)) {
      return;
    }

    try {
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        next
      );
    } catch {
      // The theme still works for this session.
    }

    const canCrossfade =
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    if (canCrossfade) {
      document.startViewTransition(() => {
        flushSync(() => {
          setThemeState(next);
        });
      });
    } else {
      setThemeState(next);
    }
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (
        event.key === THEME_STORAGE_KEY &&
        isTheme(event.newValue)
      ) {
        setThemeState(event.newValue);
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return {
    theme,
    setTheme,
  };
}

export function ThemeToggle({
  theme,
  onSetTheme,
  className,
}) {
  const reduceMotion = useReducedMotion();

  const next =
    THEMES.find((item) => item.id !== theme) ??
    THEMES[0];

  const label = `Switch to ${next.label.toLowerCase()} theme`;

  return (
    <button
      type="button"
      className={clsx(
        'commandIconBtn',
        className
      )}
      onClick={() => onSetTheme(next.id)}
      aria-label={label}
      title={label}
    >
      <motion.i
        key={next.id}
        className={`bi ${next.icon}`}
        aria-hidden="true"
        initial={
          reduceMotion
            ? { opacity: 0 }
            : {
                opacity: 0,
                rotate: -70,
                scale: 0.6,
              }
        }
        animate={{
          opacity: 1,
          rotate: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.22,
          ease: EASE,
        }}
      />
    </button>
  );
}

export function ThemeChoice({
  theme,
  onSetTheme,
}) {
  return (
    <div
      className="presetRow"
      role="radiogroup"
      aria-label="Theme"
    >
      {THEMES.map((option) => (
        <button
          type="button"
          key={option.id}
          role="radio"
          aria-checked={theme === option.id}
          className={clsx('chip', {
            'chip--active':
              theme === option.id,
          })}
          onClick={() => onSetTheme(option.id)}
        >
          <i
            className={`bi ${option.icon}`}
            aria-hidden="true"
          />{' '}
          {option.label}
        </button>
      ))}
    </div>
  );
}