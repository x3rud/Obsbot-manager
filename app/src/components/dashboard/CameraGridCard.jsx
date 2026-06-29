import { Card, CardContent } from '@/components/ui/card';
import { useDashboardContext } from '@/context/DashboardContext';
import CameraInfoPopover from './CameraInfoPopover';
import CameraActions from './CameraActions';
import PtzJoystick from '@/components/ui/ptz-joystick';

export default function CameraGridCard({ cam }) {
  const { alives, errors, infos, joystickOpen, selectedCameras, toggleCamera } = useDashboardContext();

  return (
    <Card className={`bg-background p-2 transition-colors ${selectedCameras[cam.id] ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!selectedCameras[cam.id]}
              onChange={() => toggleCamera(cam.id)}
              className="accent-blue-500 cursor-pointer"
            />
            <CameraInfoPopover cam={cam} />
          </div>
          <span className={alives[cam.id] ? 'text-green-700' : 'text-red-700'}>⬤</span>
        </div>

        <p className="text-sm text-gray-400 mt-1">{cam.ip}</p>
        {errors[cam.id] && <p className="text-yellow-400 text-xs mt-1">{errors[cam.id]}</p>}
        {infos[cam.id] && <p className="text-green-400 text-xs mt-1">{infos[cam.id]}</p>}

        <div className="mt-2">
          <CameraActions cam={cam} />
        </div>

        {joystickOpen[cam.id] && <PtzJoystick cam={cam} />}
      </CardContent>
    </Card>
  );
}
