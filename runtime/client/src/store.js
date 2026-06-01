import { proxy, snapshot, subscribe } from 'valtio';

export const userState = createStorageProxy('user-state', {
  myStuff: {}, // { [movieId]: { rating: 'liked' | 'disliked', movie: {...} } }
});

export function groupByRating(snap) {
  return Object.values(snap.myStuff).reduce(
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

function getStoredValue(key, defaultValue) {
  try {
    const storageItem = localStorage.getItem(key);

    if (storageItem) {
      return JSON.parse(storageItem);
    }
  } catch {
    console.warn('Could not parse persisted state');
  }

  return defaultValue;
}
