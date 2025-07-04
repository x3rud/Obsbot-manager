const axios = require('axios');
require('dotenv').config();

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

module.exports = apiClient;
