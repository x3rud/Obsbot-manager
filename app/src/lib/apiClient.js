import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 6000,
});

export const apiClient = {
  getGroups: () => client.get('/groups'),
  addGroup: (group) => client.post('/groups', group),
  deleteGroup: (id) => client.delete(`/groups/${id}`),

  getCameras: () => client.get('/cameras'),
  addCamera: (camera) => client.post('/cameras', camera),
  bulkAddCameras: (cameras) => client.post('/cameras/bulk', { cameras }),
  editCamera: (id, camera) => client.put(`/cameras/${id}`, camera),
  deleteCamera: (id) => client.delete(`/cameras/${id}`),

  getCameraStatus: (ip) => client.get(`/camera-status/${ip}`),
  pingCamera: (ip) => client.get(`/ping/${ip}`, {
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
    },
  }),

  sendCommand: (ip, command, data, mode) =>
    client.post('/command', { ip, command, data, mode }),

  ptzGimbalControl: (ip, { stop, pitch, yaw, roll = 0 }) =>
    client.post('/command', { ip, command: 'ptz/gimbalcontrol', data: { stop, pitch, yaw, roll }, mode: 'post' }),

  ptzGetZoom: (ip) =>
    client.post('/command', { ip, command: 'ptz/zoom', data: null, mode: 'get' }),

  ptzSetZoom: (ip, ratio) =>
    client.post('/command', { ip, command: 'ptz/zoom', data: { ratio, speed: 0 }, mode: 'put' }),

  checkUpdate: () => client.get('/update/check'),
  applyUpdate: () => client.post('/update/apply'),
};
