## CS Capstone Project

## Running the App

To simply run the app, create a `docker-compose.yml` file like the following:

```yaml
services:
  c964-movie-recommender:
    image: ghcr.io/dtgreene/c964-movie-recommender:latest
    ports:
      - '5005:5005'
    environment:
      - TMDB_READ_ACCESS_TOKEN: your_token_here
```

Then while in the same folder as the docker-compose.yml run:

```bash
docker compose up
```

To run the container in the background add `-d` to the above command.

You can learn more about using Docker by [reading the official Docker documentation.](https://docs.docker.com/)

