import { Fragment } from 'react';
import { InfoIcon } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export const InfoTooltip = ({ id, children, ...other }) => (
  <Fragment>
    <span data-tooltip-id={id} className="cursor-pointer inline-block">
      <InfoIcon size="18" />
    </span>
    <Tooltip id={id} place="top" className="max-w-100 z-10" {...other}>
      {children}
    </Tooltip>
  </Fragment>
);
