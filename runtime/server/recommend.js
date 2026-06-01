import fs from 'fs';
import path from 'path';
import { Matrix } from 'ml-matrix';

import { l2normalize } from './transform.js';

const MODEL_DIR = path.join(import.meta.dirname, 'model');
const N_COMPONENTS = 100;

const movieIds = JSON.parse(
  fs.readFileSync(path.join(MODEL_DIR, 'movie_ids.json')),
);
export const idToIndex = new Map(movieIds.map((id, i) => [id, i]));

const vectorsBuffer = fs.readFileSync(
  path.join(MODEL_DIR, 'movie_vectors.bin'),
);
const movieMatrix = Matrix.from1DArray(
  movieIds.length,
  N_COMPONENTS,
  Array.from(
    new Float32Array(
      vectorsBuffer.buffer,
      vectorsBuffer.byteOffset,
      movieIds.length * N_COMPONENTS,
    ),
  ),
);

export function getVector(id) {
  const idx = idToIndex.get(id);
  if (idx === undefined) return null;
  return movieMatrix.getRow(idx);
}

export function recommend({
  likedVectors,
  dislikedVectors,
  excludeIds,
  topN = 20,
}) {
  if (likedVectors.length === 0) return [];

  const toCol = (v) => Matrix.columnVector(Array.from(v));
  const meanCol = (vectors) => {
    return vectors
      .reduce((acc, v) => acc.add(toCol(v)), new Matrix(N_COMPONENTS, 1))
      .div(vectors.length);
  };

  let pref = meanCol(likedVectors);
  if (dislikedVectors.length > 0) {
    pref = pref.sub(meanCol(dislikedVectors).mul(0.5));
  }
  pref = l2normalize(pref);

  // Score all movies: (n_movies x N_COMPONENTS) @ (N_COMPONENTS x 1) = (n_movies x 1)
  const scoreCol = movieMatrix.mmul(pref);
  const excluded = new Set(excludeIds);

  return movieIds
    .map((id, i) => ({ id, score: scoreCol.get(i, 0) }))
    .filter(({ id }) => !excluded.has(id))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ id }) => id);
}
