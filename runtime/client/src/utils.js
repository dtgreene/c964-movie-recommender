import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export const useTimedFlag = (trigger, durationMs = 10_000) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    setActive(true);

    const id = setTimeout(() => {
      setActive(false);
    }, durationMs);

    return () => clearTimeout(id);
  }, [trigger, durationMs]);

  return active;
};

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function errorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}

export function formatReleaseDate(date) {
  if (!date) return null;

  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
