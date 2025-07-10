// components/IconTooltipButton.jsx
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export default function IconTooltipButton({ onClick, tooltip, icon, className = '' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={onClick} className={className}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
