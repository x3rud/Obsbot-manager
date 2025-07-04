const apiClient = require('../utils/apiClient');

const AiService = {
  getAiWorkMode: () => apiClient.get('/ai/workmode'),
  setAiWorkMode: (mode) => apiClient.put('/ai/workmode', { mode: mode}),

  getAiHumanMe: () => apiClient.get('/ai/human/onlyme'),
  setAiHumanMe: (enable) => apiClient.put('/ai/human/onlyme', { enable: enable }),

  getAiHumanZoom: () => apiClient.get('/ai/human/zoomtype'),
  setAiHumanZoom: (zoom) => apiClient.put('/ai/human/zoomtype', { type: zoom }),

  getAiTrackSpeed: () => apiClient.get('/ai/trackspeed'),
  setAiTrackSpeed: (speed) => apiClient.put('/ai/trackspeed', { speed: speed }),

};

module.exports = AiService;
