import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import IconTooltipButton from './components/ui/icon-tooltip-button';
import {
  HandRaisedIcon, ViewfinderCircleIcon, ArrowsPointingInIcon, GlobeAltIcon,
  PencilSquareIcon, InformationCircleIcon, ExclamationTriangleIcon,
  ArrowsPointingOutIcon, Squares2X2Icon, ListBulletIcon,
  BookmarkSquareIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import DeleteAlterDialog from './components/ui/delete-alert-dialog';
import CameraDialog from './components/ui/camera-dialog';
import GroupDialog from './components/ui/group-dialog';
import BulkCameraDialog from './components/ui/bulk-camera-dialog';
import CameraPresetsDialog from './components/ui/camera-presets-dialog';
import CameraSettingsDialog from './components/ui/camera-settings-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/apiClient';
import PtzJoystick from './components/ui/ptz-joystick';

export default function AdminDashboard() {
  const [groups, setGroups] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [errors, setErrors] = useState({});
  const [infos, setInfos] = useState({});
  const [statuses, setStatuses] = useState({});
  const [alives, setAlives] = useState({});
  const [cameraInfo, setCameraInfo] = useState({});
  const [joystickOpen, setJoystickOpen] = useState({});
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [selectedCameras, setSelectedCameras] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (Object.keys(infos).length > 0) {
      const t = setTimeout(() => setInfos({}), 5000);
      return () => clearTimeout(t);
    }
  }, [infos]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const t = setTimeout(() => setErrors({}), 5000);
      return () => clearTimeout(t);
    }
  }, [errors]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchData() {
    const [groupRes, cameraRes] = await Promise.all([
      apiClient.getGroups(),
      apiClient.getCameras(),
    ]);
    setGroups(groupRes.data);
    setCameras(cameraRes.data);
    toast.promise(checkStatus(cameraRes.data), {
      loading: 'Loading statuses...',
      success: <b>Status Loaded!</b>,
      error: <b>Ops!</b>,
    });
    checkAlive(cameraRes.data);
    cameraRes.data.forEach(cam => fetchCameraInfos(cam));
  }

  async function checkStatus(camerasList = cameras) {
    await Promise.all(
      camerasList.map(async (cam) => {
        try {
          const res = await apiClient.getCameraStatus(cam.ip);
          setStatuses(prev => ({ ...prev, [cam.id]: res.data.status }));
        } catch {
          setStatuses(prev => ({ ...prev, [cam.id]: false }));
        }
      })
    );
  }

  async function checkAlive(camerasList = cameras) {
    const aliveMap = {};
    await Promise.all(
      camerasList.map(async (cam) => {
        try {
          const res = await apiClient.pingCamera(cam.ip);
          aliveMap[cam.id] = res.status === 200;
        } catch {
          aliveMap[cam.id] = false;
        }
      })
    );
    setAlives(aliveMap);
  }

  async function checkSingleStatus(cam) {
    try {
      const res = await apiClient.getCameraStatus(cam.ip);
      setStatuses(prev => ({ ...prev, [cam.id]: res.data.status }));
    } catch {
      setStatuses(prev => ({ ...prev, [cam.id]: false }));
    }
  }

  // ── Command dispatch ───────────────────────────────────────────────────────

  async function sendCommandToList(mode, camList, command, data, refresh = true) {
    const errs = {};
    const msgs = {};
    const CONCURRENCY = 2;
    for (let i = 0; i < camList.length; i += CONCURRENCY) {
      await Promise.all(
        camList.slice(i, i + CONCURRENCY).map(async (cam) => {
          try {
            const res = await apiClient.sendCommand(cam.ip, command, data, mode);
            if (res.status !== 200) errs[cam.id] = `Returned ${res.status}`;
            else msgs[cam.id] = `Returned ${res.status}`;
          } catch (err) {
            errs[cam.id] = err.message;
          }
        })
      );
    }
    setErrors(errs);
    setInfos(msgs);
    if (refresh) {
      toast.promise(checkStatus(camList), {
        loading: 'Loading statuses...',
        success: <b>Status Loaded!</b>,
        error: <b>Ops!</b>,
      });
    }
  }

  async function sendCommand(mode, groupId, command, data, refresh = true) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    await sendCommandToList(mode, cameras.filter(c => c.groupId === groupId), command, data, refresh);
  }

  async function sendSingleCommand(mode, cam, command, data, refresh = true) {
    if (!cam) return;
    const errs = {};
    const msgs = {};
    let res;
    try {
      res = await apiClient.sendCommand(cam.ip, command, data, mode);
      if (res.status !== 200) errs[cam.id] = `Returned ${res.status}`;
      else msgs[cam.id] = 'Success';
    } catch (err) {
      errs[cam.id] = err.message;
    }
    setErrors(errs);
    setInfos(msgs);
    if (refresh) {
      toast.promise(checkSingleStatus(cam), {
        loading: 'Loading statuses...',
        success: <b>Status Loaded!</b>,
        error: <b>Ops!</b>,
      });
    }
    return res;
  }

  // ── Selection helpers ──────────────────────────────────────────────────────

  const toggleCamera = (id) =>
    setSelectedCameras(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleAllInGroup = (groupId, checked) => {
    const groupCams = cameras.filter(c => c.groupId === groupId);
    setSelectedCameras(prev => {
      const next = { ...prev };
      groupCams.forEach(c => { next[c.id] = checked; });
      return next;
    });
  };

  const selectedInGroup = (groupId) =>
    cameras.filter(c => c.groupId === groupId && selectedCameras[c.id]);

  // ── Camera-level actions ───────────────────────────────────────────────────

  async function fetchCameraInfos(cam) {
    try {
      const [lock, rec, zoom, resolution] = await Promise.all([
        sendSingleCommand('get', cam, 'ai/gesturecontrol/lockedtarget', null, false),
        sendSingleCommand('get', cam, 'ai/gesturecontrol/recording', null, false),
        sendSingleCommand('get', cam, 'ai/gesturecontrol/zoom', null, false),
        sendSingleCommand('get', cam, 'record/resolution', null, false),
      ]);
      setCameraInfo(prev => ({
        ...prev,
        [cam.id]: {
          lockedtarget: lock?.data.enable,
          recording: rec?.data.enable,
          zoom: zoom?.data.enable,
          resolution: resolution?.data.resolution,
        },
      }));
    } catch {
      setErrors(prev => ({ ...prev, [cam.id]: 'Failed to fetch camera info' }));
    }
  }

  const disableGestureControls = async (cam) => {
    try {
      await sendSingleCommand('put', cam, 'ai/gesturecontrol/lockedtarget', { enable: false }, false);
      await sendSingleCommand('put', cam, 'ai/gesturecontrol/recording', { enable: false }, false);
      await sendSingleCommand('put', cam, 'ai/gesturecontrol/zoom', { enable: false }, false);
      setInfos(prev => ({ ...prev, [cam.id]: 'Gesture controls disabled' }));
      fetchCameraInfos(cam);
    } catch (err) {
      setErrors(prev => ({ ...prev, [cam.id]: 'Failed to disable gesture controls: ' + err }));
    }
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleAddCamera = async (camera) => {
    try { await apiClient.addCamera(camera); fetchData(); } catch (err) { console.error(err); }
  };
  const handleEditCamera = async (camera) => {
    try { await apiClient.editCamera(camera.id, camera); fetchData(); } catch (err) { console.error(err); }
  };
  const handleAddGroup = async (group) => {
    try { await apiClient.addGroup(group); fetchData(); } catch (err) { console.error(err); }
  };
  const handleDeleteGroup = async (id) => {
    try { await apiClient.deleteGroup(id); fetchData(); } catch (err) { console.error(err); }
  };
  const handleDeleteCamera = async (id) => {
    try { await apiClient.deleteCamera(id); fetchData(); } catch (err) { console.error(err); }
  };
  const handleBulkAddCameras = async (cameraList) => {
    try {
      const res = await apiClient.bulkAddCameras(cameraList);
      toast.success(`Added ${res.data.inserted} camera(s)${res.data.skipped.length ? `, skipped ${res.data.skipped.length}` : ''}`);
      fetchData();
    } catch (err) {
      toast.error('Bulk add failed: ' + err.message);
    }
  };

  // ── Update handlers ────────────────────────────────────────────────────────

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    try {
      const res = await apiClient.checkUpdate();
      setUpdateInfo(res.data);
      if (res.data.upToDate) toast.success(`Already on latest (${res.data.current})`);
    } catch {
      toast.error('Could not reach GitHub to check for updates');
    } finally {
      setUpdateStatus('idle');
    }
  };

  const applyUpdate = async () => {
    setUpdateStatus('applying');
    try {
      const res = await apiClient.applyUpdate();
      toast.success(res.data.message);
      setUpdateInfo(null);
    } catch (err) {
      toast.error('Update failed: ' + (err.response?.data?.error ?? err.message));
    } finally {
      setUpdateStatus('idle');
    }
  };

  // ── Shared camera action buttons ───────────────────────────────────────────

  function CameraActions({ cam }) {
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
        <CameraDialog onClick={handleEditCamera} trigger={<PencilSquareIcon className="size-5" />} groups={groups} camera={cam} />
        <DeleteAlterDialog onClick={() => handleDeleteCamera(cam.id)} />
        <CameraPresetsDialog
          cam={cam}
          trigger={
            <button className="p-1.5 rounded hover:bg-accent" title="Presets">
              <BookmarkSquareIcon className="size-5" />
            </button>
          }
        />
        <CameraSettingsDialog
          cam={cam}
          trigger={
            <button className="p-1.5 rounded hover:bg-accent" title="Settings">
              <Cog6ToothIcon className="size-5" />
            </button>
          }
        />
        {joystickButton}
      </div>
    );
  }

  function CameraInfoPopover({ cam }) {
    return (
      <Popover>
        <PopoverTrigger>
          <div className="flex gap-2 items-center">
            {cam.name}
            <InformationCircleIcon className="size-4 text-gray-400" />
            {(cameraInfo[cam.id]?.lockedtarget || cameraInfo[cam.id]?.recording || cameraInfo[cam.id]?.zoom) && (
              <ExclamationTriangleIcon className="text-yellow-500 size-4" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col gap-2">
          <span>🎯 Tracking gesture: {cameraInfo[cam.id]?.lockedtarget ? 'On' : 'Off'}</span>
          <span>🎥 Recording gesture: {cameraInfo[cam.id]?.recording ? 'On' : 'Off'}</span>
          <span>🔍 Zoom gesture: {cameraInfo[cam.id]?.zoom ? 'On' : 'Off'}</span>
          <span>Resolution: {cameraInfo[cam.id]?.resolution}</span>
        </PopoverContent>
      </Popover>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 min-h-screen">
      <Toaster />

      {/* Header */}
      <div className="flex justify-between items-center mb-4 space-x-2">
        <h1 className="text-2xl font-bold">OBSBOT Camera Admin</h1>
        <div className="flex items-center space-x-2">
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
          <Button onClick={() => toast.promise(checkAlive(cameras), {
            loading: 'Checking alive',
            success: <b>Success!</b>,
            error: <b>Ops!</b>,
          })}>Check alive</Button>

          {/* View mode toggle */}
          <div className="flex border border-input rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'}`}
              title="Grid view"
            >
              <Squares2X2Icon className="size-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'}`}
              title="List view"
            >
              <ListBulletIcon className="size-5" />
            </button>
          </div>

          <GroupDialog onClick={handleAddGroup} trigger="Add group" />
          <CameraDialog onClick={handleAddCamera} trigger="Add camera" groups={groups} />
        </div>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <p className="text-gray-400">No groups available.</p>
      ) : (
        groups.map(group => {
          const groupCameras = cameras.filter(c => c.groupId === group.id);
          const sel = selectedInGroup(group.id);
          const allChecked = groupCameras.length > 0 && groupCameras.every(c => selectedCameras[c.id]);
          const someChecked = groupCameras.some(c => selectedCameras[c.id]);

          return (
            <Card key={group.id} className="m-4 py-2">
              <CardContent className="p-4">

                {/* Group header */}
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h2 className="text-xl font-semibold text-white">Group: {group.name}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => {
                      toast.promise(checkStatus(groupCameras), {
                        loading: 'Loading statuses...',
                        success: <b>Status Loaded!</b>,
                        error: <b>Ops!</b>,
                      });
                    }}>Check tracking</Button>
                    <Button size="sm" onClick={() => sendCommand('put', group.id, 'ai/workmode', { mode: 'humanTrackingSingleMode' })}>
                      Start Tracking
                    </Button>
                    <Button size="sm" onClick={() => sendCommand('put', group.id, 'ai/workmode', { mode: 'none' })}>
                      Stop Tracking
                    </Button>
                    <Button size="sm" onClick={() => sendCommand('post', group.id, 'ptz/reset', {}, false)}>
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
                    <Button size="sm" onClick={() => sendCommandToList('put', sel, 'ai/workmode', { mode: 'humanTrackingSingleMode' })}>
                      Start Tracking
                    </Button>
                    <Button size="sm" onClick={() => sendCommandToList('put', sel, 'ai/workmode', { mode: 'none' })}>
                      Stop Tracking
                    </Button>
                    <Button size="sm" onClick={() => sendCommandToList('put', sel, 'ptz/preset', { operation: 'call', id: 0 }, false)}>
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

                  /* ── Grid view ── */
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    {groupCameras.map(cam => (
                      <Card key={cam.id} className={`bg-background p-2 transition-colors ${selectedCameras[cam.id] ? 'ring-2 ring-blue-500' : ''}`}>
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
                    ))}
                  </div>

                ) : (

                  /* ── List view ── */
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
                          <tr
                            key={cam.id}
                            className={`border-t border-border transition-colors ${selectedCameras[cam.id] ? 'bg-blue-950/30' : idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                          >
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
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statuses[cam.id] ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
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
                        ))}
                      </tbody>
                    </table>
                  </div>

                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
