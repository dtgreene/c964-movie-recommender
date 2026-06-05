import { Fragment, useState } from 'react';
import { useSnapshot } from 'valtio';
import { useQuery } from '@tanstack/react-query';
import { Tooltip } from 'react-tooltip';
import { ExternalLinkIcon, InfoIcon } from 'lucide-react';
import { Link } from 'react-router';

import { useDebounce } from 'utils';
import { api } from 'query';
import { groupByRating, userState } from 'store';
import { BinarySwitch } from '../BinarySwitch';
import { BrowseSuggestion } from '../BrowseSuggestion';
import { InfoTooltip } from '../InfoTooltip';
import { QueryState } from '../QueryState';
import { RecommendationsList } from '../RecommendationsList';

/*
Taste Signal measures how closely related your liked movies are to each other. A
strong signal means your picks cluster tightly in the same genre, style, or
theme — giving the recommender a clear target. A weak signal means your
selections are not very related and the recommendations will be less accurate.
*/

export const RecommendationsTab = ({ isActive, onTabChange }) => {
  const [isList, setIsList] = useState(true);
  const userSnap = useSnapshot(userState);
  const { voteWeight, popularWeight, poolSize, dislikeWeight } =
    userSnap.recommendParams;

  const debounceVoteWeight = useDebounce(voteWeight, 400);
  const debouncePopularWeight = useDebounce(popularWeight, 400);
  const debouncedPoolSize = useDebounce(poolSize, 400);
  const debouncedDislikeWeight = useDebounce(dislikeWeight, 400);

  const { liked, disliked } = groupByRating(userSnap.myStuff);
  const movieIds = liked.concat(disliked).map((movie) => movie.id);
  const minLikedDelta = 5 - liked.length;
  const hasMinLiked = minLikedDelta <= 0;

  const { data, isPending, error } = useQuery({
    queryKey: [
      'recommendations',
      ...movieIds,
      debounceVoteWeight,
      debouncePopularWeight,
      debouncedPoolSize,
      debouncedDislikeWeight,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      liked.forEach((movie) => {
        params.append('liked', movie.id);
      });
      disliked.forEach((movie) => {
        params.append('disliked', movie.id);
      });

      params.set('imdb_vote_weight', debounceVoteWeight);
      params.set('tmdb_popular_weight', debouncePopularWeight);
      params.set('pool_size', debouncedPoolSize);
      params.set('dislike_weight', debouncedDislikeWeight);

      const response = await api.get(`/api/recommendations?${params}`);
      return response.data;
    },
    enabled: hasMinLiked && isActive,
  });

  const visualsLink = (
    <div>
      <Link
        to="/visuals"
        className="text-sky-600 hover:underline cursor-pointer text-xl inline-flex items-center justify-center gap-2"
        target="_blank"
      >
        <span>Dataset Visualizations</span>
        <ExternalLinkIcon />
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      {hasMinLiked ? (
        <Fragment>
          {!isPending && (
            <Fragment>
              <div className="flex w-full md:flex-row md:justify-center flex-col items-center gap-8 mt-6">
                <div className="flex flex-col gap-4 w-80">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <InfoTooltip id="info-vote-weight">
                        Pushes results toward higher-rated films, even if they
                        are a weaker match for your taste profile.
                      </InfoTooltip>
                      <span>IMDb Vote Weight</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.25"
                      className="w-full"
                      value={voteWeight}
                      onChange={(event) => {
                        userState.recommendParams.voteWeight =
                          event.target.value;
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <InfoTooltip id="info-popular-weight">
                        <div className="mb-2">
                          The TMDb Popularity Score is a dynamic, daily-updated
                          metric that measures how much user attention and
                          engagement a title is receiving on the platform.
                        </div>
                        <div>
                          Pushes results toward more trending films, even if
                          they are a weaker match for your taste profile.
                        </div>
                      </InfoTooltip>
                      <span>TMDb Popular Weight</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.25"
                      className="w-full"
                      value={popularWeight}
                      onChange={(event) => {
                        userState.recommendParams.popularWeight =
                          event.target.value;
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-4 w-80">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <InfoTooltip id="info-pool-size">
                        <div className="mb-2">
                          Before applying weights, a pool of movies are created
                          based solely on relevance to your preferences. The
                          larger the pool size, the more movies the weights have
                          to work with.
                        </div>
                        <div>
                          This slider changes the pool size between 200 and 500.
                        </div>
                      </InfoTooltip>
                      <span>Rank Pool Size</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.25"
                      className="w-full"
                      value={poolSize}
                      onChange={(event) => {
                        userState.recommendParams.poolSize = event.target.value;
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <InfoTooltip id="info-dislike-weight">
                        <div className="mb-2">
                          Controls how much disliked movies steer results away.
                          At 0, dislikes are ignored. At 1, they push as hard as
                          likes pull.
                        </div>
                      </InfoTooltip>
                      <span>Dislike Weight</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.25"
                      className="w-full"
                      value={dislikeWeight}
                      onChange={(event) => {
                        userState.recommendParams.dislikeWeight =
                          event.target.value;
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6">{visualsLink}</div>
            </Fragment>
          )}
          <div className="mt-12 w-full">
            <QueryState isLoading={isPending} error={error}>
              <RecommendationsList data={data} />
            </QueryState>
          </div>
        </Fragment>
      ) : (
        <div className="mt-12 text-zinc-500 flex flex-col gap-2 text-center">
          <div className="text-xl">
            Like {minLikedDelta} more movie
            {minLikedDelta !== 1 ? 's' : ''} to unlock recommendations.
          </div>
          <BrowseSuggestion onTabChange={onTabChange} />
          <div className="mt-6">{visualsLink}</div>
        </div>
      )}
    </div>
  );
};
