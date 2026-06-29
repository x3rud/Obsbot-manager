import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function IconTooltipButton({ onClick, tooltip, icon, className = '' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`p-1.5 rounded hover:bg-accent text-foreground transition-colors ${className}`}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
