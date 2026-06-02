import { cn } from '../utils';

export const BinarySwitch = ({
  onText,
  offText,
  isActive,
  onSwitchOn,
  onSwitchOff,
}) => (
  <div className="relative rounded-full bg-zinc-200 p-1">
    <div
      className={cn(
        'rounded-full w-26 h-8 px-2 py-1 absolute bg-sky-600 top-1 left-1 pointer-events-none transition-transform duration-200',
        { 'translate-x-26': !isActive },
      )}
    ></div>
    <button
      className={cn('w-26 h-8 px-2 py-1 cursor-pointer relative', {
        'text-white': isActive,
      })}
      onClick={onSwitchOn}
    >
      {onText}
    </button>
    <button
      className={cn('w-26 h-8 px-2 py-1 cursor-pointer relative', {
        'text-white': !isActive,
      })}
      onClick={onSwitchOff}
    >
      {offText}
    </button>
  </div>
);
