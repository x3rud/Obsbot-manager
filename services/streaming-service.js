const apiClient = require('../utils/apiClient');

const StreamingService = {
  getStreamingProtocol: () => apiClient.get('/ndi-rtsp-srt/control'),
  setStreamingProtocol: (protocol) => apiClient.put('/ndi-rtsp-srt/control', { control: protocol}),

  getStreamingBitrate: () => apiClient.get('/ndi-rtsp-srt/bitrate'),
  setStreamingBitrate: (bitrate) => apiClient.put('/ndi-rtsp-srt/bitrate', { bitrate: bitrate }),

  getStreamingEncoder: () => apiClient.get('/ndi-rtsp-srt/encoder'),
  setStreamingEncoder: (encoder) => apiClient.put('/ndi-rtsp-srt/encoder', { encoder: encoder }),

  getStreamingResolution: () => apiClient.get('/ndi-rtsp-srt/resolution'),
  setStreamingResolution: (resolution) => apiClient.put('/ndi-rtsp-srt/resolution', { resolution: resolution }),

};

module.exports = StreamingService;
