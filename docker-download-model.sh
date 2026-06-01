#!/bin/sh
mkdir -p runtime/model
curl -fsSL https://github.com/dtgreene/c964-movie-recommender/releases/latest/download/model.tar.gz | \
    tar -xz -C runtime/model
