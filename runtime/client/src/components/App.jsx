import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  BookmarkIcon,
  ChartNoAxesColumnIncreasingIcon,
  SearchIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { BorderBeam } from 'border-beam';
import { useSnapshot } from 'valtio';

import { cn, useTimedFlag } from 'utils';
import { queryClient } from 'query';
import { userState, groupByRating } from 'store';
import { MyStuffTab } from './tabs/MyStuffTab';
import { SearchTab } from './tabs/SearchTab';
import { PopularTab } from './tabs/PopularTab';
import { RecommendationsTab } from './tabs/RecommendationsTab';

const Tabs = Object.freeze({
  POPULAR: 'popular',
  SEARCH: 'search',
  MY_STUFF: 'my_stuff',
  RECOMMENDATIONS: 'recommendations',
});

const TabPanel = ({ render, isActive }) => (
  <div
    className={cn('my-12 flex-1', {
      hidden: !isActive,
    })}
  >
    {render({ isActive })}
  </div>
);

const TabButton = ({ children, onClick, isActive, className }) => (
  <button
    onClick={onClick}
    className={cn(
      'text-nowrap cursor-pointer w-1/4 p-2 flex justify-center items-center gap-2 border-2 rounded-full transition-colors hover:bg-zinc-100 border-zinc-200',
      {
        'border-sky-600 text-sky-600': isActive,
      },
      className,
    )}
  >
    {children}
  </button>
);

export const App = () => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap.myStuff);
  const hasMinLiked = liked.length >= 5;
  const borderBeamActive = useTimedFlag(hasMinLiked);

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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex justify-center">
        <div className="max-w-300 flex-1">
          <div className="flex justify-evenly w-full gap-4">
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
              {liked.length > 0 && (
                <div className="rounded-full border border-emerald-500 text-emerald-500 w-6 h-6 relative">
                  <span className="absolute left-0 top-0 w-full h-full flex justify-center items-center font-mono">
                    {liked.length}
                  </span>
                </div>
              )}
            </TabButton>
            <BorderBeam className="w-1/4" active={borderBeamActive}>
              <TabButton
                onClick={() => handleTabChange(Tabs.RECOMMENDATIONS)}
                isActive={tab === Tabs.RECOMMENDATIONS}
                className="w-full"
              >
                <WandSparklesIcon className="shrink-0" size="20" />
                <span>Recommendations</span>
              </TabButton>
            </BorderBeam>
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
              render={(props) => (
                <MyStuffTab {...props} onTabChange={handleTabChange} />
              )}
            />
            <TabPanel
              isActive={tab === Tabs.RECOMMENDATIONS}
              render={(props) => (
                <RecommendationsTab {...props} onTabChange={handleTabChange} />
              )}
            />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};
