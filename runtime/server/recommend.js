import fs from 'fs';
import path from 'path';

const MODEL_DIR = path.join(import.meta.dirname, 'model');
const N_COMPONENTS = 100;
const N_FEATURES = 5000;

const movieIds = JSON.parse(fs.readFileSync(path.join(MODEL_DIR, 'movie_ids.json')));
export const idToIndex = new Map(movieIds.map((id, i) => [id, i]));

const vectorsBuffer = fs.readFileSync(path.join(MODEL_DIR, 'movie_vectors.bin'));
const movieVectors = new Float32Array(
  vectorsBuffer.buffer,
  vectorsBuffer.byteOffset,
  movieIds.length * N_COMPONENTS,
);

export const vocabulary = JSON.parse(
  fs.readFileSync(path.join(MODEL_DIR, 'vocabulary.json')),
);

let idfWeights = null;
let svdComponents = null;
try {
  const idfBuf = fs.readFileSync(path.join(MODEL_DIR, 'idf_weights.bin'));
  idfWeights = new Float32Array(idfBuf.buffer, idfBuf.byteOffset, N_FEATURES);
  const svdBuf = fs.readFileSync(path.join(MODEL_DIR, 'svd_components.bin'));
  svdComponents = new Float32Array(svdBuf.buffer, svdBuf.byteOffset, N_COMPONENTS * N_FEATURES);
} catch {}

export function getVector(id) {
  const idx = idToIndex.get(id);
  if (idx === undefined) return null;
  return movieVectors.subarray(idx * N_COMPONENTS, (idx + 1) * N_COMPONENTS);
}

// Matches the text construction in train.py
export function buildMovieText({ genres, cast, overview, crew, tagline }) {
  const genreNames = (genres ?? []).map((g) => g.name).join(' ');
  const castNames = (cast ?? []).slice(0, 10).map((c) => c.name).join(' ');
  const director = (crew ?? []).find((c) => c.job === 'Director')?.name ?? '';
  const writers = (crew ?? [])
    .filter((c) => c.department === 'Writing')
    .map((c) => c.name)
    .join(' ');
  return [genreNames, castNames, overview ?? '', director, tagline ?? '', writers].join(' ');
}

// Replicates sklearn TfidfVectorizer.transform + L2 norm + SVD projection + L2 norm
export function computeVector(text) {
  if (!idfWeights || !svdComponents) return null;

  // sklearn default token_pattern: \b\w\w+\b (words of 2+ chars)
  const tokens = text.toLowerCase().match(/\b\w{2,}\b/g) ?? [];
  const counts = new Map();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);

  const tfidf = new Float32Array(N_FEATURES);
  for (const [term, count] of counts) {
    const idx = vocabulary[term];
    if (idx !== undefined) tfidf[idx] = count * idfWeights[idx];
  }

  // L2-normalize TF-IDF (sklearn norm='l2')
  let tfidfNorm = 0;
  for (const v of tfidf) tfidfNorm += v * v;
  tfidfNorm = Math.sqrt(tfidfNorm);
  if (tfidfNorm > 0) for (let i = 0; i < N_FEATURES; i++) tfidf[i] /= tfidfNorm;

  // Project via SVD components (shape: N_COMPONENTS x N_FEATURES, row-major)
  const projected = new Float32Array(N_COMPONENTS);
  for (let i = 0; i < N_COMPONENTS; i++) {
    let dot = 0;
    const off = i * N_FEATURES;
    for (let j = 0; j < N_FEATURES; j++) dot += svdComponents[off + j] * tfidf[j];
    projected[i] = dot;
  }

  // L2-normalize projected vector (matches normalize(vectors) in train.py)
  let norm = 0;
  for (const v of projected) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < N_COMPONENTS; i++) projected[i] /= norm;

  return projected;
}

export function recommend({ likedVectors, dislikedVectors, excludeIds, topN = 20 }) {
  if (likedVectors.length === 0) return [];

  // Preference vector = mean(liked) - 0.5 * mean(disliked), then L2-normalize
  const pref = new Float32Array(N_COMPONENTS);
  for (const v of likedVectors)
    for (let i = 0; i < N_COMPONENTS; i++) pref[i] += v[i] / likedVectors.length;
  if (dislikedVectors.length > 0)
    for (const v of dislikedVectors)
      for (let i = 0; i < N_COMPONENTS; i++) pref[i] -= (0.5 * v[i]) / dislikedVectors.length;

  let norm = 0;
  for (const v of pref) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < N_COMPONENTS; i++) pref[i] /= norm;

  const excluded = new Set(excludeIds);
  const scores = [];
  for (let i = 0; i < movieIds.length; i++) {
    const id = movieIds[i];
    if (excluded.has(id)) continue;
    let dot = 0;
    const off = i * N_COMPONENTS;
    for (let j = 0; j < N_COMPONENTS; j++) dot += movieVectors[off + j] * pref[j];
    scores.push({ id, score: dot });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topN).map((s) => s.id);
}
