import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';

import { userState } from '../store';
import { useSnapshot } from 'valtio';

export const MovieThumbnail = ({
  movie: { id, title, release_date, poster_path },
}) => {
  const userSnap = useSnapshot(userState);
  const isLiked = userSnap.myStuff[id]?.rating === 'liked';
  const isDisliked = userSnap.myStuff[id]?.rating === 'disliked';

  const handleThumbsUp = () => {
    if (!isLiked) {
      userState.myStuff[id] = {
        rating: 'liked',
        movie: { id, title, release_date, poster_path },
      };
    } else {
      delete userState.myStuff[id];
    }
  };

  const handleThumbsDown = () => {
    if (!isDisliked) {
      userState.myStuff[id] = {
        rating: 'disliked',
        movie: { id, title, release_date, poster_path },
      };
    } else {
      delete userState.myStuff[id];
    }
  };

  return (
    <div className="border border-zinc-300 shadow-lg shadow-zinc-300 rounded flex flex-col overflow-hidden w-44">
      <div className="w-full aspect-2/3 shrink-0 relative group">
        <img
          src={`http://image.tmdb.org/t/p/w300${poster_path}`}
          className="w-full h-full"
          alt="Movie poster"
        />
        {isLiked && (
          <div className="absolute bottom-0 bg-emerald-500 w-full text-white p-1 text-center font-bold">
            LIKED
          </div>
        )}
        {isDisliked && (
          <div className="absolute bottom-0 bg-rose-500 w-full text-white p-1 text-center font-bold">
            DISLIKED
          </div>
        )}
        <div className="absolute right-0 top-0 p-2 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleThumbsUp}
            className="bg-emerald-500/75 hover:bg-emerald-500 text-white rounded-full p-3 not-disabled:cursor-pointer transition-colors"
          >
            <ThumbsUpIcon size="24" />
          </button>
          <button
            onClick={handleThumbsDown}
            className="bg-rose-500/75 hover:bg-rose-500 text-white rounded-full p-3 not-disabled:cursor-pointer transition-colors"
          >
            <ThumbsDownIcon size="24" />
          </button>
        </div>
      </div>
      <div className="p-2">
        <a
          className="line-clamp-2 font-semibold hover:underline block cursor-pointer"
          href={`https://www.themoviedb.org/movie/${id}`}
          target="_blank"
          rel="noreferrer"
        >
          {title}
        </a>
        <div>
          {new Date(release_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
};
