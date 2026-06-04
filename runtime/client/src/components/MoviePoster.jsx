import { ImageOffIcon } from 'lucide-react';
import { useState } from 'react';

export const MoviePoster = ({ posterPath, className }) => {
  const [imgSrc, setImgSrc] = useState(
    posterPath ? `http://image.tmdb.org/t/p/w300${posterPath}` : null,
  );

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        onError={() => setImgSrc(null)}
        className={className}
        alt="Movie poster"
      />
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-center items-center h-full">
        <ImageOffIcon className="text-zinc-300" size="128" />
      </div>
    </div>
  );
};
