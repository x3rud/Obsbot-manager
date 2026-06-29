import { useDashboardContext } from '@/context/DashboardContext';
import CameraActions from './CameraActions';

export default function CameraListRow({ cam, idx }) {
  const { alives, errors, infos, statuses, cameraInfo, selectedCameras, toggleCamera } = useDashboardContext();

  return (
    <tr className={`border-t border-border transition-colors ${
      selectedCameras[cam.id] ? 'bg-blue-950/30' : idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
    }`}>
      <td className="p-3">
        <input
          type="checkbox"
          checked={!!selectedCameras[cam.id]}
          onChange={() => toggleCamera(cam.id)}
          className="accent-blue-500 cursor-pointer"
        />
      </td>
      <td className="p-3">
        <span className={alives[cam.id] ? 'text-green-600' : 'text-red-600'}>⬤</span>
      </td>
      <td className="p-3 font-medium">
        {cam.name}
        {errors[cam.id] && <p className="text-yellow-400 text-xs mt-0.5">{errors[cam.id]}</p>}
        {infos[cam.id] && <p className="text-green-400 text-xs mt-0.5">{infos[cam.id]}</p>}
      </td>
      <td className="p-3 text-muted-foreground font-mono">{cam.ip}</td>
      <td className="p-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          statuses[cam.id] ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
        }`}>
          {statuses[cam.id] ? 'Tracking' : 'Idle'}
        </span>
      </td>
      <td className="p-3">
        <div className="flex gap-2 text-base">
          <span title="Tracking gesture" className={cameraInfo[cam.id]?.lockedtarget ? 'opacity-100' : 'opacity-25'}>🎯</span>
          <span title="Recording gesture" className={cameraInfo[cam.id]?.recording ? 'opacity-100' : 'opacity-25'}>🎥</span>
          <span title="Zoom gesture" className={cameraInfo[cam.id]?.zoom ? 'opacity-100' : 'opacity-25'}>🔍</span>
        </div>
      </td>
      <td className="p-3 text-muted-foreground text-xs">
        {cameraInfo[cam.id]?.resolution ?? '—'}
      </td>
      <td className="p-3">
        <div className="flex justify-end">
          <CameraActions cam={cam} />
        </div>
      </td>
    </tr>
  );
}
