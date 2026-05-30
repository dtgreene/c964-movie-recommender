import { configDotenv } from 'dotenv';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';

configDotenv();

const fastify = Fastify({ logger: true });
const PORT = process.env.PORT ?? 8080;

fastify.register(fastifyStatic, {
  root: path.join(import.meta.dirname, 'public'),
  wildcard: false,
});

fastify.get('/api', async (request, reply) => {
  return { status: 'ok' };
});

fastify.setNotFoundHandler((request, reply) => {
  reply.sendFile('index.html');
});

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
