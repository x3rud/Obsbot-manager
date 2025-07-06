import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const API_BASE = 'http://localhost:3001/api'; // Assuming backend is exposed under /api

export default function AdminDashboard() {
  const [groups, setGroups] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [errors, setErrors] = useState({});
  const [infos, setInfos] = useState({});
  const [statuses, setStatuses] = useState({});
  const [alives, setAlives] = useState({});
  const [showAddCameraModal, setShowAddCameraModal] = useState(false);
  const [showEditCameraModal, setShowEditCameraModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', ip: '', groupId: '' });
  const [newGroup, setNewGroup] = useState({ name: '' });

  useEffect(() => {
    fetchData().then(() => checkAlive());
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
    const statusMap = {};
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

    await Promise.all(
      groupCameras.map(async (cam) => {
        try {
          const res = await axios({method: mode, url: `${API_BASE}/command`, data: {
            ip: cam.ip,
            command,
            data
          }
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
    try {
        const res = await axios({method: mode, url: `${API_BASE}/command`, data: {
          ip: cam.ip,
          command,
          data
        }
      });
        if (res.status !== 200) {
          errors[cam.id] = `Returned ${res.status}`;
        }
      } catch (err) {
        errors[cam.id] = err.message;
      }
    setErrors(errors);
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
  }

  const handleAddCamera = async () => {
    try {
      await axios.post(`${API_BASE}/cameras`, newCamera);
      setShowAddCameraModal(false);
      setNewCamera({ name: '', ip: '', groupId: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCamera = async () => {
    try {
      await axios.put(`${API_BASE}/cameras/${newCamera.id}`, newCamera);
      setShowEditCameraModal(false);
      setNewCamera({ name: '', ip: '', groupId: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGroup = async () => {
    try {
      await axios.post(`${API_BASE}/groups`, newGroup);
      setShowAddGroupModal(false);
      setNewGroup({ name: '' });
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

  const disableGestureControls = (cam) => {
    sendSingleCommand('put', cam, 'ai/gesturecontrol/lockedtarget', {enable: false}, false) 
    sendSingleCommand('put', cam, 'ai/gesturecontrol/recording', {enable: false}, false) 
    sendSingleCommand('put', cam, 'ai/gesturecontrol/zoom', {enable: false}, false)
  }

  return (
    <div className="p-6 bg-neutral-800 min-h-screen text-white">
      <div><Toaster/></div>
      <div className="flex justify-between items-center mb-4 space-x-2">
        <h1 className="text-2xl font-bold">OBSBOT Camera Admin</h1>
        <div className="space-x-2">
          <Button onClick={() => checkAlive(cameras)}>Check alive</Button>
          <Button onClick={() => setShowAddGroupModal(true)}>Add Group</Button>
          <Button onClick={() => setShowAddCameraModal(true)}>Add Camera</Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-gray-400">No groups available.</p>
      ) : (
        groups.map(group => (
          <Card key={group.id} className="m-4 bg-neutral-700 border-0 py-2">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Group: {group.name}</h2>
                </div>
                <div className="flex justify-end items-center gap-4">
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
                    <div key={cam.id} className="border-0 bg-neutral-800 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span>{cam.name}</span>
                        <span className={alives[cam.id] ? 'text-green-700' : 'text-red-700'}> ⬤ </span>
                      </div>
                      <p className="text-sm text-gray-400">{cam.ip}</p>
                      {errors[cam.id] && (
                        <p className="text-yellow-400 text-sm mt-2">{errors[cam.id]}</p>
                      )}
                      <div className="flex flex-wrap justify-end gap-2 mt-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={() => disableGestureControls(cam) }>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" />
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Only Disable Gestures Control
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={() => statuses[cam.id] ?  sendSingleCommand('put', cam, 'ai/workmode', {mode: "none"}) : sendSingleCommand('put', cam, 'ai/workmode', {mode: "humanTrackingSingleMode"}) } className={(statuses[cam.id] ? 'bg-red-500' : '')}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Start / Stop Tracking
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={() => sendSingleCommand('put', cam, '/ptz/preset', { operation: "call", id: 0}, false) }>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                            </svg>
                          </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Reset to preset 1
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={() => window.open("http://"+cam.ip, "_blank") }>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Open Webpage
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={() => { setNewCamera(cam); setShowEditCameraModal(true)}}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Edit Camera
                          </TooltipContent>
                        </Tooltip>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the camera from the database.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCamera(cam.id)} >Yes please!</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {showAddCameraModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-neutral-700 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Camera</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Camera Name"
                value={newCamera.name}
                onChange={e => setNewCamera({ ...newCamera, name: e.target.value })}
                className="w-full px-4 py-2 rounded bg-neutral-800 text-white"
              />
              <input
                type="text"
                placeholder="Camera IP"
                value={newCamera.ip}
                onChange={e => setNewCamera({ ...newCamera, ip: e.target.value })}
                className="w-full px-4 py-2 rounded bg-neutral-800 text-white"
              />
              <select
                value={newCamera.groupId}
                onChange={e => setNewCamera({ ...newCamera, groupId: e.target.value })}
                className="w-full px-4 py-2 rounded bg-neutral-800 text-white"
              >
                <option value="">Select Group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setShowAddCameraModal(false)}>Cancel</Button>
                <Button onClick={handleAddCamera}>Add</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditCameraModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-neutral-700 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Camera</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Camera Name"
                value={newCamera.name}
                onChange={e => setNewCamera({ ...newCamera, name: e.target.value })}
                className="w-full px-4 py-2 rounded bg-neutral-800 text-white"
              />
              <input
                type="text"
                placeholder="Camera IP"
                value={newCamera.ip}
                onChange={e => setNewCamera({ ...newCamera, ip: e.target.value })}
                className="w-full px-4 py-2 rounded bg-neutral-800 text-white"
              />
              <select
                value={newCamera.groupId}
                onChange={e => setNewCamera({ ...newCamera, groupId: e.target.value })}
                className="w-full px-4 py-2 rounded bg-neutral-800 text-white"
              >
                <option value="">Select Group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setShowEditCameraModal(false)}>Cancel</Button>
                <Button onClick={handleEditCamera}>Edit</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-neutral-700 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Group</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Group Name"
                value={newGroup.name}
                onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                className="w-full px-4 py-2 rounded bg-neutral-800 text-white"
              />
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setShowAddGroupModal(false)}>Cancel</Button>
                <Button onClick={handleAddGroup}>Add</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}