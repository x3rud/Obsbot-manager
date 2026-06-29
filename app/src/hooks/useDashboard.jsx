import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

const CONCURRENCY = 2;

async function runBatched(items, fn) {
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.all(items.slice(i, i + CONCURRENCY).map(fn));
  }
}

export function useDashboard() {
  const [groups, setGroups] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [alives, setAlives] = useState({});
  const [cameraInfo, setCameraInfo] = useState({});
  const [errors, setErrors] = useState({});
  const [infos, setInfos] = useState({});
  const [joystickOpen, setJoystickOpen] = useState({});
  const [selectedCameras, setSelectedCameras] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('idle');

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (Object.keys(infos).length === 0) return;
    const t = setTimeout(() => setInfos({}), 5000);
    return () => clearTimeout(t);
  }, [infos]);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const t = setTimeout(() => setErrors({}), 5000);
    return () => clearTimeout(t);
  }, [errors]);

  // ── Data ────────────────────────────────────────────────────────────────────

  async function fetchData() {
    const [groupRes, cameraRes] = await Promise.all([
      apiClient.getGroups(),
      apiClient.getCameras(),
    ]);
    setGroups(groupRes.data);
    setCameras(cameraRes.data);
    toast.promise(checkStatus(cameraRes.data), {
      loading: 'Loading statuses…',
      success: <b>Status loaded!</b>,
      error: <b>Error loading statuses</b>,
    });
    checkAlive(cameraRes.data);
    cameraRes.data.forEach(cam => fetchCameraInfo(cam));
  }

  async function checkStatus(list = cameras) {
    await Promise.all(list.map(async cam => {
      try {
        const res = await apiClient.getCameraStatus(cam.ip);
        setStatuses(prev => ({ ...prev, [cam.id]: res.data.status }));
      } catch {
        setStatuses(prev => ({ ...prev, [cam.id]: false }));
      }
    }));
  }

  async function checkSingleStatus(cam) {
    try {
      const res = await apiClient.getCameraStatus(cam.ip);
      setStatuses(prev => ({ ...prev, [cam.id]: res.data.status }));
    } catch {
      setStatuses(prev => ({ ...prev, [cam.id]: false }));
    }
  }

  async function checkAlive(list = cameras) {
    const map = {};
    await Promise.all(list.map(async cam => {
      try {
        const res = await apiClient.pingCamera(cam.ip);
        map[cam.id] = res.status === 200;
      } catch {
        map[cam.id] = false;
      }
    }));
    setAlives(map);
  }

  async function fetchCameraInfo(cam) {
    try {
      const [lock, rec, zoom, resolution] = await Promise.all([
        apiClient.sendCommand(cam.ip, 'ai/gesturecontrol/lockedtarget', null, 'get'),
        apiClient.sendCommand(cam.ip, 'ai/gesturecontrol/recording', null, 'get'),
        apiClient.sendCommand(cam.ip, 'ai/gesturecontrol/zoom', null, 'get'),
        apiClient.sendCommand(cam.ip, 'record/resolution', null, 'get'),
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
      // Silently ignore — offline cameras are already shown via the alive indicator
    }
  }

  // ── Commands ─────────────────────────────────────────────────────────────────

  async function sendSingleCommand(mode, cam, command, data, refresh = true) {
    if (!cam) return;
    let res;
    const errs = {};
    const msgs = {};
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
        loading: 'Loading status…',
        success: <b>Done!</b>,
        error: <b>Error</b>,
      });
    }
    return res;
  }

  async function sendCommandToList(mode, camList, command, data, refresh = true) {
    const errs = {};
    const msgs = {};
    await runBatched(camList, async cam => {
      try {
        const res = await apiClient.sendCommand(cam.ip, command, data, mode);
        if (res.status !== 200) errs[cam.id] = `Returned ${res.status}`;
        else msgs[cam.id] = `Returned ${res.status}`;
      } catch (err) {
        errs[cam.id] = err.message;
      }
    });
    setErrors(errs);
    setInfos(msgs);
    if (refresh) {
      toast.promise(checkStatus(camList), {
        loading: 'Loading statuses…',
        success: <b>Status loaded!</b>,
        error: <b>Error</b>,
      });
    }
  }

  async function sendGroupCommand(mode, groupId, command, data, refresh = true) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    await sendCommandToList(mode, cameras.filter(c => c.groupId === groupId), command, data, refresh);
  }

  async function disableGestureControls(cam) {
    try {
      await apiClient.sendCommand(cam.ip, 'ai/gesturecontrol/lockedtarget', { enable: false }, 'put');
      await apiClient.sendCommand(cam.ip, 'ai/gesturecontrol/recording', { enable: false }, 'put');
      await apiClient.sendCommand(cam.ip, 'ai/gesturecontrol/zoom', { enable: false }, 'put');
      setInfos(prev => ({ ...prev, [cam.id]: 'Gesture controls disabled' }));
      fetchCameraInfo(cam);
    } catch (err) {
      setErrors(prev => ({ ...prev, [cam.id]: 'Failed to disable gestures: ' + err }));
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async function handleAddCamera(camera) {
    try { await apiClient.addCamera(camera); fetchData(); } catch (err) { console.error(err); }
  }
  async function handleEditCamera(camera) {
    try { await apiClient.editCamera(camera.id, camera); fetchData(); } catch (err) { console.error(err); }
  }
  async function handleAddGroup(group) {
    try { await apiClient.addGroup(group); fetchData(); } catch (err) { console.error(err); }
  }
  async function handleDeleteGroup(id) {
    try { await apiClient.deleteGroup(id); fetchData(); } catch (err) { console.error(err); }
  }
  async function handleDeleteCamera(id) {
    try { await apiClient.deleteCamera(id); fetchData(); } catch (err) { console.error(err); }
  }
  async function handleBulkAddCameras(cameraList) {
    try {
      const res = await apiClient.bulkAddCameras(cameraList);
      toast.success(`Added ${res.data.inserted} camera(s)${res.data.skipped.length ? `, skipped ${res.data.skipped.length}` : ''}`);
      fetchData();
    } catch (err) {
      toast.error('Bulk add failed: ' + err.message);
    }
  }

  // ── Updates ───────────────────────────────────────────────────────────────────

  async function checkForUpdates() {
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
  }

  async function applyUpdate() {
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
  }

  // ── Selection ─────────────────────────────────────────────────────────────────

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

  return {
    // State
    groups, cameras, statuses, alives, cameraInfo,
    errors, infos, joystickOpen, setJoystickOpen,
    selectedCameras, viewMode, setViewMode,
    updateInfo, updateStatus,
    // Commands
    sendSingleCommand, sendCommandToList, sendGroupCommand, disableGestureControls,
    checkStatus, checkAlive, fetchCameraInfo,
    // CRUD
    handleAddCamera, handleEditCamera, handleAddGroup,
    handleDeleteGroup, handleDeleteCamera, handleBulkAddCameras,
    // Updates
    checkForUpdates, applyUpdate,
    // Selection
    toggleCamera, toggleAllInGroup, selectedInGroup,
  };
}
