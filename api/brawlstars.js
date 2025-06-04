const axios = require('axios');
const { apiToken, baseUrl } = require('../config');

async function getPlayerStats(tag) {
  const encodedTag = tag.startsWith('%23') ? tag : `%23${tag.replace('#', '')}`;

  const response = await axios.get(`${baseUrl}${encodedTag}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  });

  return response.data;
}

module.exports = { getPlayerStats };