## CS Capstone Project

## Running the App

To simply run the app, create a `docker-compose.yml` file like the following:

```yaml
services:
  c964-movie-recommender:
    build:
      context: https://github.com/dtgreene/c964-movie-recommender.git#main
    ports:
      - '8080:8080'
```

Then while in the same folder as the docker-compose.yml run:

```bash
docker compose up --build
```

To run the container in the background add `-d` to the above command.

You can learn more about using Docker by [reading the official Docker documentation.](https://docs.docker.com/)

---

## Development

### Prerequisites

- Python 3.12+
- Node.js 24+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- [TMDB API read access token](https://developer.themoviedb.org/docs/getting-started)

### Setup

From the repo root, install dependencies for both Python and Node.js:

```bash
uv sync
npm install
```

Create a `.env` file in the repo root with the following:

```
TMDB_READ_ACCESS_TOKEN=your_token_here
```

### Running

Start the API server (port 8080):

```bash
uv run uvicorn main:app --reload --app-dir runtime/server
```

Start the client dev server (port 3000):

```bash
npm run dev
```

Then visit http://localhost:3000/ to see the dev app. Changes to both the frontend and backend will hot reload their respective server.

---

### Trainer

If you'd like to run the trainer yourself, first run the prep data script. This will automatically download the movie dataset from Kaggle if it's missing:

```bash
uv run trainer/scripts/prep_data.py
```

Then run the training script:

```bash
uv run trainer/scripts/train.py
```

The training script will produce run time files that will be used by the recommendation endpoint.
