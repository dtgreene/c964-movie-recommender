import { Fragment } from 'react';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { useSnapshot } from 'valtio';

import { userState } from 'store';
import { formatReleaseDate } from 'utils';
import { MoviePoster } from './MoviePoster';

export const MovieCardSlim = ({ movie }) => (
  <div className="border border-zinc-300 shadow-lg shadow-zinc-300 rounded flex flex-col overflow-hidden w-48">
    <MoviePoster movie={movie} />
    <div className="p-2">
      <div>
        <a
          className="line-clamp-2 font-semibold hover:underline cursor-pointer inline"
          href={`https://www.themoviedb.org/movie/${movie.id}`}
          target="_blank"
          rel="noreferrer"
        >
          {movie.title}
        </a>
      </div>
      <div>{formatReleaseDate(movie.release_date)}</div>
    </div>
  </div>
);
