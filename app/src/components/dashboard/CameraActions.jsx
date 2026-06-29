import {
  HandRaisedIcon, ViewfinderCircleIcon, ArrowsPointingInIcon,
  GlobeAltIcon, PencilSquareIcon, ArrowsPointingOutIcon,
  BookmarkSquareIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import IconTooltipButton from '@/components/ui/icon-tooltip-button';
import DeleteAlterDialog from '@/components/ui/delete-alert-dialog';
import CameraDialog from '@/components/ui/camera-dialog';
import CameraPresetsDialog from '@/components/ui/camera-presets-dialog';
import CameraSettingsDialog from '@/components/ui/camera-settings-dialog';
import PtzJoystick from '@/components/ui/ptz-joystick';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboardContext } from '@/context/DashboardContext';

export default function CameraActions({ cam }) {
  const {
    groups, statuses, viewMode,
    joystickOpen, setJoystickOpen,
    sendSingleCommand, disableGestureControls,
    handleEditCamera, handleDeleteCamera,
  } = useDashboardContext();

  const joystickButton = viewMode === 'list' ? (
    <Dialog
      open={!!joystickOpen[cam.id]}
      onOpenChange={open => setJoystickOpen(prev => ({ ...prev, [cam.id]: open }))}
    >
      <IconTooltipButton
        onClick={() => setJoystickOpen(prev => ({ ...prev, [cam.id]: true }))}
        tooltip="PTZ Joystick"
        className={joystickOpen[cam.id] ? 'bg-blue-600' : ''}
        icon={<ArrowsPointingOutIcon className="size-5" />}
      />
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>PTZ — {cam.name}</DialogTitle>
        </DialogHeader>
        <PtzJoystick cam={cam} />
      </DialogContent>
    </Dialog>
  ) : (
    <IconTooltipButton
      onClick={() => setJoystickOpen(prev => ({ ...prev, [cam.id]: !prev[cam.id] }))}
      tooltip="PTZ Joystick"
      className={joystickOpen[cam.id] ? 'bg-blue-600' : ''}
      icon={<ArrowsPointingOutIcon className="size-5" />}
    />
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
        tooltip="Reset"
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
        <CameraDialog
          onClick={handleEditCamera}
          trigger={
            <TooltipTrigger asChild>
              <button className="p-1.5 rounded hover:bg-accent text-foreground transition-colors">
                <PencilSquareIcon className="size-5" />
              </button>
            </TooltipTrigger>
          }
          groups={groups}
          camera={cam}
        />
        <TooltipContent>Edit</TooltipContent>
      </Tooltip>
      <DeleteAlterDialog onClick={() => handleDeleteCamera(cam.id)} />
      <Tooltip>
        <CameraPresetsDialog
          cam={cam}
          trigger={
            <TooltipTrigger asChild>
              <button className="p-1.5 rounded hover:bg-accent text-foreground transition-colors">
                <BookmarkSquareIcon className="size-5" />
              </button>
            </TooltipTrigger>
          }
        />
        <TooltipContent>Presets</TooltipContent>
      </Tooltip>
      <Tooltip>
        <CameraSettingsDialog
          cam={cam}
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
