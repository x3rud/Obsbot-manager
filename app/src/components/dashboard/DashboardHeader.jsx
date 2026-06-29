import { Button } from '@/components/ui/button';
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import GroupDialog from '@/components/ui/group-dialog';
import CameraDialog from '@/components/ui/camera-dialog';
import { useDashboardContext } from '@/context/DashboardContext';
import toast from 'react-hot-toast';

export default function DashboardHeader() {
  const {
    cameras, groups,
    viewMode, setViewMode,
    updateInfo, updateStatus,
    checkForUpdates, applyUpdate, checkAlive,
    handleAddGroup, handleAddCamera,
  } = useDashboardContext();

  return (
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <h1 className="text-2xl font-bold">OBSBOT Camera Admin</h1>

      <div className="flex items-center gap-2 flex-wrap">
        {updateInfo && !updateInfo.upToDate && (
          <Button
            onClick={applyUpdate}
            disabled={updateStatus === 'applying'}
            className="bg-yellow-500 hover:bg-yellow-400 text-black"
          >
            {updateStatus === 'applying' ? 'Updating…' : `Update to ${updateInfo.latest}`}
          </Button>
        )}

        <Button variant="outline" onClick={checkForUpdates} disabled={updateStatus === 'checking'}>
          {updateStatus === 'checking' ? 'Checking…' : updateInfo?.current ? `v${updateInfo.current}` : 'Check updates'}
        </Button>

        <Button variant="outline" onClick={() => toast.promise(checkAlive(cameras), {
          loading: 'Checking alive…',
          success: <b>Done!</b>,
          error: <b>Error</b>,
        })}>
          Check alive
        </Button>

        {/* Grid / List toggle */}
        <div className="flex border border-input rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
          >
            <Squares2X2Icon className="size-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
          >
            <ListBulletIcon className="size-5" />
          </button>
        </div>

        <GroupDialog onClick={handleAddGroup} trigger={<Button>Add group</Button>} />
        <CameraDialog onClick={handleAddCamera} trigger={<Button>Add camera</Button>} groups={groups} />
      </div>
    </div>
  );
}
