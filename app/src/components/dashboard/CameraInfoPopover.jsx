import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useDashboardContext } from '@/context/DashboardContext';

export default function CameraInfoPopover({ cam }) {
  const { cameraInfo } = useDashboardContext();
  const info = cameraInfo[cam.id];
  const hasActiveGesture = info?.lockedtarget || info?.recording || info?.zoom;

  return (
    <Popover>
      <PopoverTrigger>
        <div className="flex gap-2 items-center">
          {cam.name}
          <InformationCircleIcon className="size-4 text-gray-400" />
          {hasActiveGesture && <ExclamationTriangleIcon className="text-yellow-500 size-4" />}
        </div>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2">
        <span>🎯 Tracking gesture: {info?.lockedtarget ? 'On' : 'Off'}</span>
        <span>🎥 Recording gesture: {info?.recording ? 'On' : 'Off'}</span>
        <span>🔍 Zoom gesture: {info?.zoom ? 'On' : 'Off'}</span>
        <span>Resolution: {info?.resolution ?? '—'}</span>
      </PopoverContent>
    </Popover>
  );
}
