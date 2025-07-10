import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import IconTooltipButton from './components/ui/icon-tooltip-button';
import { HandRaisedIcon, ViewfinderCircleIcon, ArrowsPointingInIcon, GlobeAltIcon, PencilSquareIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import DeleteAlterDialog from './components/ui/delete-alert-dialog';
import CameraDialog from './components/ui/camera-dialog';
import GroupDialog from './components/ui/group-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const API_BASE = 'http://localhost:3001/api'; 

export default function AdminDashboard() {
  const [groups, setGroups] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [errors, setErrors] = useState({});
  const [infos, setInfos] = useState({});
  const [statuses, setStatuses] = useState({});
  const [alives, setAlives] = useState({});
  const [cameraInfo, setCameraInfo] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (Object.keys(infos).length > 0) {
      const timer = setTimeout(() => setInfos({}), 5000);
      return () => clearTimeout(timer);
    }
  }, [infos]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => setErrors({}), 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  async function fetchData() {
    const [groupRes, cameraRes] = await Promise.all([
      axios.get(`${API_BASE}/groups`),
      axios.get(`${API_BASE}/cameras`),
    ]);

    setGroups(groupRes.data);
    setCameras(cameraRes.data);
    toast.promise(
      checkStatus(cameraRes.data),
      {
        loading: 'Loadig statuses...',
        success: <b>Status Loaded!</b>,
        error: <b>Ops!</b>,
      }
    );
    checkAlive(cameraRes.data);
    cameraRes.data.map(async (cam) => {
      fetchCameraInfos(cam);
    })
  }

  async function checkStatus(camerasList = cameras) {
    await Promise.all(
      camerasList.map(async (cam) => {
        try {
          const res = await axios({method: 'get', url: `${API_BASE}/camera-status/${cam.ip}`});
          setStatuses(prev => ({ ...prev, [cam.id]: res.data.status }));
        } catch {
          setStatuses(prev => ({ ...prev, [cam.id]: false }));
        }
      })
    );
  }

  async function checkAlive(camerasList =  cameras) {
    const aliveMap = {};
    await Promise.all(
      camerasList.map(async (cam) => {
        try {
          const res = await axios({
            method: 'get',
            url: `${API_BASE}/ping/${cam.ip}`,
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
              Expires: '0',
            },
          });
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
      const res = await axios({method: 'get', url: `${API_BASE}/camera-status/${cam.ip}`});
      setStatuses(prev => ({ ...prev, [cam.id]: res.data.status }));
    } catch {
      setStatuses(prev => ({ ...prev, [cam.id]: false }));
    }
  }

  async function sendCommand(mode, groupId, command, data, refresh = true) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const groupCameras = cameras.filter(c => c.groupId === groupId);
    const errors = {};
    const infos = {};

    await Promise.all(
      groupCameras.map(async (cam) => {
        try {
          const res = await axios.post(`${API_BASE}/command`, {
            ip: cam.ip,
            command,
            data,
            mode
          });
          if (res.status !== 200) {
            errors[cam.id] = `Returned ${res.status}`;
          }else{
            infos[cam.id] = `Returned ${res.status}`;
          }
        } catch (err) {
          errors[cam.id] = err.message;
        }
      })
    );
    setErrors(errors);
    setInfos(infos);
    if(refresh) {
      toast.promise(
        checkStatus(groupCameras),
        {
          loading: 'Loadig statuses...',
          success: <b>Status Loaded!</b>,
          error: <b>Ops!</b>,
        }
      );
    }
  }

  async function sendSingleCommand(mode, cam, command, data, refresh = true) {
    if (!cam) return;
    const errors = {};
    const infos = {};
    let res;
    try {
      res = await axios.post(`${API_BASE}/command`, {
        ip: cam.ip,
        command,
        data,
        mode
      });
      if (res.status !== 200) {
        errors[cam.id] = `Returned ${res.status}`;
      }else {
        infos[cam.id] = 'Success';
      }
    } catch (err) {
      errors[cam.id] = err.message;
    }
    setErrors(errors);
    setInfos(infos);
    if(refresh) {
      toast.promise(
        checkSingleStatus(cam),
        {
          loading: 'Loadig statuses...',
          success: <b>Status Loaded!</b>,
          error: <b>Ops!</b>,
        }
      );
    }
    return res;
  }

  async function getGroupCameraSatus(groupId) {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;
      const groupCameras = cameras.filter(c => c.groupId === groupId);

      toast.promise(
        checkStatus(groupCameras),
        {
          loading: 'Loadig statuses...',
          success: <b>Status Loaded!</b>,
          error: <b>Ops!</b>,
        }
      );
    }

  async function fetchCameraInfos (cam) {
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
          resolution: resolution?.data.resolution
        }
      }));
    } catch {
        setErrors(prev => ({ ...prev, [cam.id]: 'Failed to fetch camera Infos' }));
    }
  };

  const handleAddCamera = async (camera) => {
    try {
      await axios.post(`${API_BASE}/cameras`, camera);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCamera = async (camera) => {
    try {
      await axios.put(`${API_BASE}/cameras/${camera.id}`, camera);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGroup = async (group) => {
    try {
      await axios.post(`${API_BASE}/groups`, group);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCamera = async (id) => {
    try {
      await axios.delete(`${API_BASE}/cameras/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const disableGestureControls = async (cam) => {
    try {
      await sendSingleCommand('put', cam, 'ai/gesturecontrol/lockedtarget', { enable: false }, false);
      await sendSingleCommand('put', cam, 'ai/gesturecontrol/recording', { enable: false }, false);
      await sendSingleCommand('put', cam, 'ai/gesturecontrol/zoom', { enable: false }, false);
      setInfos(prev => ({ ...prev, [cam.id]: 'Gesture controls disabled' }));
      fetchCameraInfos(cam);
    } catch (err) {
      setErrors(prev => ({ ...prev, [cam.id]: 'Failed to disable gesture controls. Error: '+err }));
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <Toaster/>
      <div className="flex justify-between items-center mb-4 space-x-2">
        <h1 className="text-2xl font-bold">OBSBOT Camera Admin</h1>
        <div className="flex items-end space-x-2">
          <Button onClick={() => toast.promise( checkAlive(cameras), {
              loading: 'Checking alive',
              success: <b>Success!</b>,
              error: <b>Ops!</b>,
            }
          )}> Check alive</Button>
          <GroupDialog onClick={handleAddGroup} trigger={"Add group"}></GroupDialog>
          <CameraDialog onClick={handleAddCamera} trigger={"Add camera"} groups={groups}></CameraDialog>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-gray-400">No groups available.</p>
      ) : (
        groups.map(group => (
          <Card key={group.id} className="m-4 py-2">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Group: {group.name}</h2>
                </div>
                <div className="flex justify-end items-center gap-4">
                  <Button onClick={() => getGroupCameraSatus(group.id)}>Check tracking</Button>
                  <Button onClick={() => sendCommand('put', group.id, 'ai/workmode', {mode: "humanTrackingSingleMode"})}> {group.name} - Start Tracking</Button>
                  <Button onClick={() => sendCommand('put',group.id, 'ai/workmode', {mode: "none"})}>{group.name} - Stop Tracking</Button>
                  <Button onClick={() => sendCommand('put', group.id, 'ptz/preset', { operation: "call", id: 0}, false)}>{group.name} - Reset position</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                {cameras.filter(c => c.groupId === group.id).length === 0 ? (
                  <p className="text-gray-400 col-span-full">No cameras in this group.</p>
                ) : (
                  cameras.filter(c => c.groupId === group.id).map(cam => (
                    <Card key={cam.id} className="bg-background p-2">
                      <CardContent className="p-4">

                      <div className="flex justify-between items-center">
                        <Popover>
                          <PopoverTrigger>
                            <div className="flex gap-2">
                              {cam.name} 
                              <InformationCircleIcon className='size-4 text-gray-400'/> 
                              {(cameraInfo[cam.id]?.lockedtarget ||
                                cameraInfo[cam.id]?.recording ||
                                cameraInfo[cam.id]?.zoom) && (
                                  <ExclamationTriangleIcon className="text-yellow-500 w-4 h-4 ml-2" />
                              )}
                              </div>
                            </PopoverTrigger>
                          <PopoverContent className="flex flex-col gap-2">
                            <span> 🎯 Tracking gesture: {cameraInfo[cam.id]?.lockedtarget ? "On" : "Off"}</span>
                            <span> 🎥 Recording gesture: {cameraInfo[cam.id]?.recording ? "On" : "Off"}</span>
                            <span> 🔍 Zoom gesture: {cameraInfo[cam.id]?.zoom ? "On" : "Off"}</span>
                            <span> Resolution: {cameraInfo[cam.id]?.resolution}</span>
                          </PopoverContent>
                        </Popover>
                        <span className={alives[cam.id] ? 'text-green-700' : 'text-red-700'}> ⬤ </span>
                      </div>

                      <p className="text-sm text-gray-400">{cam.ip}</p>
                      {errors[cam.id] && (
                        <p className="text-yellow-400 text-sm mt-2">{errors[cam.id]}</p>
                      )}
                      {infos[cam.id] && (
                        <p className="text-green-400 text-sm mt-2">{infos[cam.id]}</p>
                      )}
                      <div className="flex flex-wrap justify-end gap-2 mt-2">

                        <IconTooltipButton 
                          onClick={() => disableGestureControls(cam)} 
                          tooltip={"Only Disable Gestures Control"}
                          icon={<HandRaisedIcon className="size-6"/>}
                        />

                        <IconTooltipButton 
                          onClick={() => statuses[cam.id] ?  sendSingleCommand('put', cam, 'ai/workmode', {mode: "none"}) : sendSingleCommand('put', cam, 'ai/workmode', {mode: "humanTrackingSingleMode"})} 
                          className={(statuses[cam.id] ? 'bg-red-500' : '')}
                          tooltip={"Start / Stop Tracking"}
                          icon={<ViewfinderCircleIcon className="size-6"/>}
                        />

                        <IconTooltipButton 
                          onClick={() => sendSingleCommand('put', cam, '/ptz/preset', { operation: "call", id: 0}, false)}
                          tooltip={"Reset to preset 1"}
                          icon={<ArrowsPointingInIcon className="size-6"/>}
                        />

                        <IconTooltipButton 
                          onClick={() => window.open("http://"+cam.ip, "_blank") }
                          tooltip={"Open webpage"}
                          icon={<GlobeAltIcon className="size-6"/>}
                        />

                        <CameraDialog onClick={handleEditCamera} 
                          trigger={<PencilSquareIcon className="size-6"/>}
                          groups={groups}
                          camera={cam}
                        />

                        <DeleteAlterDialog onClick={() => handleDeleteCamera(cam.id)}/>
                      </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

    </div>
  );
}