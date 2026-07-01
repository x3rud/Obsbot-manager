import {
  HandRaisedIcon, ViewfinderCircleIcon, ArrowsPointingInIcon,
  GlobeAltIcon, ArrowsPointingOutIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import IconTooltipButton from '@/components/ui/icon-tooltip-button';
import CameraSettingsDialog from '@/components/ui/camera-settings-dialog';
import PtzDialog from '@/components/ui/ptz-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboardContext } from '@/context/DashboardContext';

export default function CameraActions({ cam }) {
  const {
    groups, statuses,
    joystickOpen, setJoystickOpen,
    sendSingleCommand, disableGestureControls,
    handleEditCamera, handleDeleteCamera,
  } = useDashboardContext();

  const joystickButton = (
    <>
      <IconTooltipButton
        onClick={() => setJoystickOpen(prev => ({ ...prev, [cam.id]: true }))}
        tooltip="PTZ Joystick"
        className={joystickOpen[cam.id] ? 'bg-blue-600' : ''}
        icon={<ArrowsPointingOutIcon className="size-5" />}
      />
      <PtzDialog
        cam={cam}
        open={!!joystickOpen[cam.id]}
        onOpenChange={open => setJoystickOpen(prev => ({ ...prev, [cam.id]: open }))}
      />
    </>
  );

  return (
    <div className="flex flex-wrap gap-1">
      <IconTooltipButton
        onClick={() => disableGestureControls(cam)}
        tooltip="Disable Gesture Controls"
        icon={<HandRaisedIcon className="size-5" />}
      />
      <IconTooltipButton
        onClick={() => sendSingleCommand('post', cam, '/ptz/reset')}
        className={statuses[cam.id] ? 'bg-red-500' : ''}
        tooltip="Reset position"
        icon={<ViewfinderCircleIcon className="size-5" />}
      />
      <IconTooltipButton
        onClick={() => sendSingleCommand('put', cam, '/ptz/preset', { operation: 'call', id: 0 }, false)}
        tooltip="Reset to preset 1"
        icon={<ArrowsPointingInIcon className="size-5" />}
      />
      <IconTooltipButton
        onClick={() => window.open('http://' + cam.ip, '_blank')}
        tooltip="Open webpage"
        icon={<GlobeAltIcon className="size-5" />}
      />
      <Tooltip>
        <CameraSettingsDialog
          cam={cam}
          groups={groups}
          onEdit={handleEditCamera}
          onDelete={handleDeleteCamera}
          trigger={
            <TooltipTrigger asChild>
              <button className="p-1.5 rounded hover:bg-accent text-foreground transition-colors">
                <Cog6ToothIcon className="size-5" />
              </button>
            </TooltipTrigger>
          }
        />
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
      {joystickButton}
    </div>
  );
}
