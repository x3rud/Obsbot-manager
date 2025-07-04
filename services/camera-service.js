
const apiClient = require('../utils/apiClient');

const CameraService = {
  triggerCapture: () => apiClient.post('/capture/trigger'),

  getRecordingStatus: () => apiClient.get('/record/control'),
  setRecordingStatus: (status) => apiClient.put('/record/control', { recording: status }),

  getRecordingBitrate: () => apiClient.get('/record/bitrate'),
  setRecordingBitrate: (bitrate) => apiClient.put('/record/bitrate', { bitrate: bitrate }),

  getRecordingEncoder: () => apiClient.get('/record/encoder'),
  setRecordingEncoder: (encoder) => apiClient.put('/record/encoder', { encoder: encoder }),

  getRecordingResolution: () => apiClient.get('/record/resolution'),
  setRecordingResolution: (resolution) => apiClient.put('/record/resolution', { resolution: resolution }),
};

module.exports = CameraService;
