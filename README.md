## CS Capstone Project

## Running the App

To simply run the app, create a `docker-compose.yml` file like the following:

```yaml
services:
  c964-movie-recommender:
    build:
      context: https://github.com/dtgreene/c964-movie-recommender.git#main:runtime
    ports:
      - "8080:8080"
```

Then while in the same folder as the docker-compose.yml run:

```bash
docker compose up --build
```

To run the container in the background add `-d` to the above command.

You can learn more about using Docker by [reading the official Docker documentation.](https://docs.docker.com/)

---

## Development

### Trainer

The trainer builds the recommendation model and writes the output to `runtime/server/model/`.

**Prerequisites:**

- Python 3.14+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- [TMDB dataset](https://www.kaggle.com/datasets/alanvourch/tmdb-movies-daily-updates) saved as `trainer/dataset/TMDB_all_movies.csv`

#### Steps

```bash
cd trainer
uv sync
uv run scripts/prep_data.py
uv run scripts/train.py
```

`prep_data.py` filters `TMDB_all_movies.csv` down to `TMDB_reduced.csv`. `train.py` then produces `movie_vectors.bin`, `movie_ids.json`, `tfidf.joblib`, and `svd.joblib` in `runtime/server/model/`.

### Runtime

The runtime is a Fastify server that serves the React frontend and exposes `/api` routes.

**Prerequisites:**

- Node.js 22+

#### Steps

```bash
cd runtime
npm install
npm run dev:server

# In a separate terminal
npm run dev:client
```
