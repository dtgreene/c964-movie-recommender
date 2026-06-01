import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  BookmarkIcon,
  ChartNoAxesColumnIncreasingIcon,
  SearchIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { useSnapshot } from 'valtio';

import { cn } from '../utils';
import { groupByRating, userState } from '../store';
import { queryClient } from '../query';
import { MyStuffTab } from './MyStuffTab';
import { SearchTab } from './SearchTab';
import { PopularTab } from './PopularTab';
import { RecommendationsTab } from './RecommendationsTab';

const Tabs = Object.freeze({
  POPULAR: 'popular',
  SEARCH: 'search',
  MY_STUFF: 'my_stuff',
  RECOMMENDATIONS: 'recommendations',
});

const TabPanel = ({ render, isActive }) => (
  <div
    className={cn('max-w-240 my-12 flex-1', {
      hidden: !isActive,
    })}
  >
    {render({ isActive })}
  </div>
);

const TabButton = ({ children, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={cn(
      'text-nowrap cursor-pointer w-full px-8 py-2 flex justify-center items-center gap-2 border-b-4 transition-colors hover:bg-zinc-100 border-zinc-200',
      {
        'border-sky-600 text-sky-600': isActive,
      },
    )}
  >
    {children}
  </button>
);

export const App = () => {
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') ?? Tabs.POPULAR;
  });

  const handleTabChange = (value) => {
    setTab(value);

    // Sync query params
    const params = new URLSearchParams(window.location.search);
    params.set('tab', value);
    window.history.replaceState(null, '', `?${params}`);
  };

  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap);
  const hasRatings = liked.length > 0 || disliked.length > 0;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex justify-center">
        <div className="max-w-400 flex-1">
          <div className="flex justify-evenly w-full">
            <TabButton
              onClick={() => handleTabChange(Tabs.POPULAR)}
              isActive={tab === Tabs.POPULAR}
            >
              <ChartNoAxesColumnIncreasingIcon className="shrink-0" size="20" />
              <span>Popular</span>
            </TabButton>
            <TabButton
              onClick={() => handleTabChange(Tabs.SEARCH)}
              isActive={tab === Tabs.SEARCH}
            >
              <SearchIcon className="shrink-0" size="20" />
              <span>Search</span>
            </TabButton>
            <TabButton
              onClick={() => handleTabChange(Tabs.MY_STUFF)}
              isActive={tab === Tabs.MY_STUFF}
            >
              <BookmarkIcon className="shrink-0" size="20" />
              <span>My Stuff</span>
              {hasRatings && (
                <span className="flex gap-1">
                  <span className="font-semibold text-emerald-500">
                    {liked.length}
                  </span>
                  <span>/</span>
                  <span className="font-semibold text-rose-500">
                    {disliked.length}
                  </span>
                </span>
              )}
            </TabButton>
            <TabButton
              onClick={() => handleTabChange(Tabs.RECOMMENDATIONS)}
              isActive={tab === Tabs.RECOMMENDATIONS}
            >
              <WandSparklesIcon className="shrink-0" size="20" />
              <span>Recommendations</span>
            </TabButton>
          </div>
          <div className="flex justify-center">
            <TabPanel
              isActive={tab === Tabs.POPULAR}
              render={(props) => <PopularTab {...props} />}
            />
            <TabPanel
              isActive={tab === Tabs.SEARCH}
              render={(props) => <SearchTab {...props} />}
            />
            <TabPanel
              isActive={tab === Tabs.MY_STUFF}
              render={(props) => <MyStuffTab {...props} />}
            />
            <TabPanel
              isActive={tab === Tabs.RECOMMENDATIONS}
              render={(props) => <RecommendationsTab {...props} />}
            />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};
