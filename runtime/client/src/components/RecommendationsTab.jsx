import { Fragment, useState } from 'react';
import { useSnapshot } from 'valtio';
import { useQuery } from '@tanstack/react-query';
import { Tooltip } from 'react-tooltip';
import { InfoIcon } from 'lucide-react';
import axios from 'axios';

import { groupByRating, userState } from '../store';
import { useDebounce } from '../utils';
import { MovieGrid } from './MovieGrid';
import { BinarySwitch } from './BinarySwitch';
import { BrowseSuggestion } from './BrowseSuggestion';
import { InfoTooltip } from './InfoTooltip';
import { QueryState } from './QueryState';

export const RecommendationsTab = ({ isActive, onTabChange }) => {
  const [isList, setIsList] = useState(true);
  const userSnap = useSnapshot(userState);
  const { voteWeight, popularWeight, poolSize } = userSnap.recommendParams;

  const debounceVoteWeight = useDebounce(voteWeight, 400);
  const debouncePopularWeight = useDebounce(popularWeight, 400);
  const debouncedPoolSize = useDebounce(poolSize, 400);

  const { liked, disliked } = groupByRating(userSnap);
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

      const response = await axios.get(`/api/recommendations?${params}`);
      return response.data;
    },
    enabled: hasMinLiked && isActive,
  });

  return (
    <div className="flex flex-col items-center">
      {hasMinLiked ? (
        <Fragment>
          {!isPending && (
            <Fragment>
              <BinarySwitch
                labelA="List"
                labelB="Grid"
                isActive={isList}
                onChange={(value) => setIsList(value)}
              />
              <div className="flex justify-between w-full mt-6">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <span>IMDb Vote Weight</span>
                    <InfoTooltip id="info-vote-weight">
                      <div className="mb-2">
                        The IMDb rating is a weighted average of votes submitted
                        by IMDb users, reflecting a film's overall critical
                        reception.
                      </div>
                      <div>
                        Increasing this weight nudges results toward
                        higher-rated films, even if they are a weaker match for
                        your taste profile.
                      </div>
                    </InfoTooltip>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.25"
                    value={voteWeight}
                    onChange={(event) => {
                      userState.recommendParams.voteWeight = event.target.value;
                    }}
                  />
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <span>TMDb Popular Weight</span>
                    <InfoTooltip id="info-popular-weight">
                      <div className="mb-2">
                        The TMDb Popularity Score is a dynamic, daily-updated
                        metric that measures how much user attention and
                        engagement a title is receiving on the platform.
                      </div>
                      <div>
                        Increasing this weight nudges results toward titles that
                        are currently trending, even if they are a weaker match
                        for your taste profile.
                      </div>
                    </InfoTooltip>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.25"
                    value={popularWeight}
                    onChange={(event) => {
                      userState.recommendParams.popularWeight =
                        event.target.value;
                    }}
                  />
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <span>Rank Pool Size</span>
                    <InfoTooltip id="info-pool-size">
                      <div>
                        Before ranking, the recommender narrows the full catalog
                        down to a pool of the closest similarity matches. A
                        larger pool gives the IMDb and popularity weights more
                        candidates to reorder.
                      </div>
                    </InfoTooltip>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.25"
                    value={poolSize}
                    onChange={(event) => {
                      userState.recommendParams.poolSize = event.target.value;
                    }}
                  />
                </div>
              </div>
            </Fragment>
          )}
          <div className="mt-6">
            <QueryState isLoading={isPending} error={error}>
              {isList ? (
                <div>List</div>
              ) : (
                <MovieGrid data={data?.results} disableRating />
              )}
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
        </div>
      )}
    </div>
  );
};
