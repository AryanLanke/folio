// Undo and redo, one step at a time. Every change is recorded; a burst of typing (until the
// person pauses) counts as one step, the way document editors work.

export type History<T> = {
  past: T[];
  future: T[];
  // When the current step started growing; 0 means the next change always starts a new step
  lastChange: number;
};

// How long a pause in typing must be before the next change becomes its own undo step
export const GROUP_MS = 1000;
export const MAX_STEPS = 100;

export function emptyHistory<T>(): History<T> {
  return { past: [], future: [], lastChange: 0 };
}

// Records a change. `previous` is the state just before it. `separate` forces a step of its
// own (for actions like removing a job or loading a template) instead of joining the typing burst.
export function record<T>(history: History<T>, previous: T, now: number, separate = false): History<T> {
  const newStep = separate || history.lastChange === 0 || now - history.lastChange > GROUP_MS;
  return {
    past: newStep ? [...history.past, previous].slice(-MAX_STEPS) : history.past,
    future: [],
    lastChange: separate ? 0 : now,
  };
}

export function undo<T>(history: History<T>, current: T): { history: History<T>; value: T } | null {
  const value = history.past.at(-1);
  if (value === undefined) return null;
  return {
    history: { past: history.past.slice(0, -1), future: [current, ...history.future], lastChange: 0 },
    value,
  };
}

export function redo<T>(history: History<T>, current: T): { history: History<T>; value: T } | null {
  const [value, ...rest] = history.future;
  if (value === undefined) return null;
  return {
    history: { past: [...history.past, current].slice(-MAX_STEPS), future: rest, lastChange: 0 },
    value,
  };
}
