import { cn } from 'utils';

export const BinarySwitch = ({ labelA, labelB, isActive, onChange }) => (
  <div className="relative rounded-full bg-zinc-200 p-1">
    <div
      className={cn(
        'rounded-full w-26 h-8 px-2 py-1 absolute bg-sky-600 top-1 left-1 pointer-events-none transition-transform duration-200',
        { 'translate-x-26': !isActive },
      )}
    ></div>
    <button
      className={cn(
        'w-26 h-8 px-2 py-1 cursor-pointer relative transition-colors',
        {
          'text-white': isActive,
        },
      )}
      onClick={() => onChange(true)}
    >
      {labelA}
    </button>
    <button
      className={cn(
        'w-26 h-8 px-2 py-1 cursor-pointer relative transition-colors',
        {
          'text-white': !isActive,
        },
      )}
      onClick={() => onChange(false)}
    >
      {labelB}
    </button>
  </div>
);
