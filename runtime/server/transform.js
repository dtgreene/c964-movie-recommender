import fs from 'fs';
import path from 'path';
import { Matrix } from 'ml-matrix';

const MODEL_DIR = path.join(import.meta.dirname, 'model');
const N_COMPONENTS = 100;
const N_FEATURES = 5000;

export const vocabulary = JSON.parse(
  fs.readFileSync(path.join(MODEL_DIR, 'vocabulary.json')),
);

const idfBuf = fs.readFileSync(path.join(MODEL_DIR, 'idf_weights.bin'));
const idfWeights = new Float32Array(
  idfBuf.buffer,
  idfBuf.byteOffset,
  N_FEATURES,
);

const svdBuf = fs.readFileSync(path.join(MODEL_DIR, 'svd_components.bin'));
const svdMatrix = Matrix.from1DArray(
  N_COMPONENTS,
  N_FEATURES,
  Array.from(
    new Float32Array(
      svdBuf.buffer,
      svdBuf.byteOffset,
      N_COMPONENTS * N_FEATURES,
    ),
  ),
);

export function l2normalize(matrix) {
  const norm = matrix.norm('frobenius');
  return norm > 0 ? matrix.div(norm) : matrix;
}

// Matches the text construction in train.py
export function buildMovieText({ genres, cast, overview, crew, tagline }) {
  const genreNames = (genres ?? []).map((g) => g.name).join(' ');
  const castNames = (cast ?? [])
    .slice(0, 10)
    .map((c) => c.name)
    .join(' ');
  const director = (crew ?? []).find((c) => c.job === 'Director')?.name ?? '';
  const writers = (crew ?? [])
    .filter((c) => c.department === 'Writing')
    .map((c) => c.name)
    .join(' ');
  return [
    genreNames,
    castNames,
    overview ?? '',
    director,
    tagline ?? '',
    writers,
  ].join(' ');
}

// Replicates sklearn TfidfVectorizer.transform + L2 norm + SVD projection + L2 norm
export function computeVector(text) {
  // sklearn default token_pattern: \b\w\w+\b (words of 2+ chars)
  const tokens = text.toLowerCase().match(/\b\w{2,}\b/g) ?? [];
  const counts = new Map();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  const tfidf = new Float32Array(N_FEATURES);
  for (const [term, count] of counts) {
    const idx = vocabulary[term];
    if (idx !== undefined) {
      tfidf[idx] = count * idfWeights[idx];
    }
  }

  // L2-normalize TF-IDF (sklearn norm='l2') — manual since tfidf is sparse
  let tfidfNorm = 0;
  for (const v of tfidf) {
    tfidfNorm += v * v;
  }
  tfidfNorm = Math.sqrt(tfidfNorm);
  if (tfidfNorm > 0) {
    for (let i = 0; i < N_FEATURES; i++) {
      tfidf[i] /= tfidfNorm;
    }
  }

  // Project: (N_COMPONENTS x N_FEATURES) @ (N_FEATURES x 1), then L2-normalize
  return l2normalize(
    svdMatrix.mmul(Matrix.columnVector(Array.from(tfidf))),
  ).to1DArray();
}
