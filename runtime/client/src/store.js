import { proxy, snapshot, subscribe } from 'valtio';

export const userState = createStorageProxy('user-state', {
  myStuff: {}, // { [movieId]: { rating: 'liked' | 'disliked', movie: {...} } }
  recommendParams: {
    voteWeight: '0.25',
    popularWeight: '0.25',
    poolSize: '0.5',
    dislikeWeight: '0.25',
  },
});

export function groupByRating(stuff) {
  return Object.values(stuff).reduce(
    (acc, { rating, movie }) => {
      if (rating === 'liked') {
        acc.liked.push(movie);
      } else {
        acc.disliked.push(movie);
      }
      return acc;
    },
    { liked: [], disliked: [] },
  );
}

function createStorageProxy(key, defaultValue) {
  const state = proxy(getStoredValue(key, defaultValue));

  subscribe(state, () => {
    try {
      localStorage.setItem(key, JSON.stringify(snapshot(state)));
    } catch (error) {
      console.error(`Could not persist state: ${error.message}`);
    }
  });

  return state;
}

function mergeWithDefaults(stored, defaults) {
  if (typeof defaults !== 'object' || Array.isArray(defaults)) {
    return stored;
  }

  const result = { ...stored };
  for (const key of Object.keys(defaults)) {
    if (!(key in result)) {
      result[key] = defaults[key];
    } else if (
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = mergeWithDefaults(result[key], defaults[key]);
    }
  }

  return result;
}

function getStoredValue(key, defaultValue) {
  try {
    const storageItem = localStorage.getItem(key);

    if (storageItem) {
      return mergeWithDefaults(JSON.parse(storageItem), defaultValue);
    }
  } catch {
    console.warn('Could not parse persisted state');
  }

  return defaultValue;
}
