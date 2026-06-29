import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import DeleteAlterDialog from '@/components/ui/delete-alert-dialog';
import BulkCameraDialog from '@/components/ui/bulk-camera-dialog';
import { useDashboardContext } from '@/context/DashboardContext';
import CameraGridCard from './CameraGridCard';
import CameraListRow from './CameraListRow';

export default function GroupCard({ group }) {
  const {
    cameras, viewMode, selectedCameras,
    sendGroupCommand, sendCommandToList,
    handleDeleteGroup, handleBulkAddCameras,
    toggleAllInGroup, selectedInGroup, checkStatus,
  } = useDashboardContext();

  const groupCameras = cameras.filter(c => c.groupId === group.id);
  const sel = selectedInGroup(group.id);
  const allChecked = groupCameras.length > 0 && groupCameras.every(c => selectedCameras[c.id]);
  const someChecked = groupCameras.some(c => selectedCameras[c.id]);

  return (
    <Card className="m-4 py-2">
      <CardContent className="p-4">

        {/* Group header */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-white">Group: {group.name}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() =>
              toast.promise(checkStatus(groupCameras), {
                loading: 'Loading statuses…',
                success: <b>Status loaded!</b>,
                error: <b>Error</b>,
              })
            }>
              Check tracking
            </Button>
            <Button variant="outline" size="sm" onClick={() => sendGroupCommand('put', group.id, 'ai/workmode', { mode: 'humanTrackingSingleMode' })}>
              Start Tracking
            </Button>
            <Button variant="outline" size="sm" onClick={() => sendGroupCommand('put', group.id, 'ai/workmode', { mode: 'none' })}>
              Stop Tracking
            </Button>
            <Button variant="outline" size="sm" onClick={() => sendGroupCommand('post', group.id, 'ptz/reset', {}, false)}>
              Reset position
            </Button>
            <BulkCameraDialog groupId={group.id} groupName={group.name} onImport={handleBulkAddCameras} trigger="Bulk Add" />
            <DeleteAlterDialog
              onClick={() => handleDeleteGroup(group.id)}
              description={`This will permanently delete the group "${group.name}" and all its cameras from the database.`}
            />
          </div>
        </div>

        {/* Selection action bar */}
        {sel.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3 px-3 py-2 rounded-md bg-blue-950/50 border border-blue-800">
            <span className="text-sm text-blue-300 font-medium">{sel.length} selected</span>
            <Button variant="outline" size="sm" onClick={() => sendCommandToList('put', sel, 'ai/workmode', { mode: 'humanTrackingSingleMode' })}>
              Start Tracking
            </Button>
            <Button variant="outline" size="sm" onClick={() => sendCommandToList('put', sel, 'ai/workmode', { mode: 'none' })}>
              Stop Tracking
            </Button>
            <Button variant="outline" size="sm" onClick={() => sendCommandToList('put', sel, 'ptz/preset', { operation: 'call', id: 0 }, false)}>
              Reset Position
            </Button>
            <Button size="sm" variant="outline" onClick={() => toggleAllInGroup(group.id, false)}>
              Clear
            </Button>
          </div>
        )}

        {groupCameras.length === 0 ? (
          <p className="text-gray-400 mt-4">No cameras in this group.</p>
        ) : viewMode === 'grid' ? (

          /* Grid view */
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {groupCameras.map(cam => (
              <CameraGridCard key={cam.id} cam={cam} />
            ))}
          </div>

        ) : (

          /* List view */
          <div className="mt-4 rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={e => toggleAllInGroup(group.id, e.target.checked)}
                      className="accent-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-8"></th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">IP</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Tracking</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Gestures</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Resolution</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupCameras.map((cam, idx) => (
                  <CameraListRow key={cam.id} cam={cam} idx={idx} />
                ))}
              </tbody>
            </table>
          </div>

        )}
      </CardContent>
    </Card>
  );
}
