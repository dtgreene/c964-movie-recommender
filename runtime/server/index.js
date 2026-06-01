import { configDotenv } from 'dotenv';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import axios from 'axios';

configDotenv();

const fastify = Fastify({ logger: true, ignoreTrailingSlash: true });
class TMDB {
  static #client = axios.create({
    baseURL: 'https://api.themoviedb.org',
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
      Accept: 'application/json',
    },
  });

  static async get(reply, path, params) {
    try {
      const response = await this.#client.get(path, {
        params: { language: 'en-US', ...params },
      });
      return response.data;
    } catch (error) {
      const status = error.response?.status ?? 500;
      reply.code(status).send({ error: 'Request failed' });
    }
  }
}

fastify.register(fastifyStatic, {
  root: path.join(import.meta.dirname, 'public'),
  wildcard: false,
});

fastify.get('/api/search', async (request, reply) => {
  const { query, page = 1 } = request.query;
  return TMDB.get(reply, '/3/search/movie', { query, page });
});

fastify.get('/api/top_rated', async (request, reply) => {
  const { page = 1 } = request.query;
  return TMDB.get(reply, '/3/movie/top_rated', { page });
});

fastify.get('/api/trending', async (request, reply) => {
  const { page = 1 } = request.query;
  return TMDB.get(reply, '/3/trending/movie/week', { page });
});

fastify.get('/api/movie/:movieId', async (request, reply) => {
  const { movieId } = request.params;
  return TMDB.get(reply, `/3/movie/${movieId}`);
});

fastify.get('/api/recommendations', async (request, reply) => {
  const { id } = request.query;
  const ids = Array.isArray(id) ? id : [id];
});

fastify.setNotFoundHandler((request, reply) => {
  reply.sendFile('index.html');
});

try {
  await fastify.listen({ port: 8080, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
