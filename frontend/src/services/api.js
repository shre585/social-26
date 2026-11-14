const BASE_URL = import.meta.env.VITE_API_URL || '';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const data = await response.json();
      errorDetail = data.detail || data.message || JSON.stringify(data);
    } catch (e) {
      errorDetail = response.statusText || `HTTP ${response.status}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

function handleNetworkError(err) {
  if (err.message && err.message.includes('Failed to fetch')) {
    throw new Error("Can't reach the server. Is the backend running?");
  }
  throw err;
}

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async getPlatforms() {
    try {
      const res = await fetch(`${BASE_URL}/api/platforms`);
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.open('POST', `${BASE_URL}/api/upload`);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.detail || `Upload failed with status ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Can't reach the server. Is the backend running?"));
      };

      xhr.send(formData);
    });
  },

  async uploadUrl(url) {
    try {
      const res = await fetch(`${BASE_URL}/api/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async startProcessing(payload) {
    try {
      const res = await fetch(`${BASE_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async getStatus(jobId) {
    try {
      const res = await fetch(`${BASE_URL}/api/status/${jobId}`);
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async getResults(jobId) {
    try {
      const res = await fetch(`${BASE_URL}/api/results/${jobId}`);
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async getJobs() {
    try {
      const res = await fetch(`${BASE_URL}/api/jobs`);
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async deleteJob(jobId) {
    try {
      const res = await fetch(`${BASE_URL}/api/results/${jobId}`, {
        method: 'DELETE'
      });
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async updateClipContent(jobId, clipId, platformId, data) {
    try {
      const res = await fetch(`${BASE_URL}/api/results/${jobId}/clips/${clipId}/${platformId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  getDownloadAllUrl(jobId) {
    return `${BASE_URL}/api/download-all/${jobId}`;
  },

  async getSettings() {
    try {
      const res = await fetch(`${BASE_URL}/api/settings`);
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async saveApiKey(provider, apiKey) {
    try {
      const res = await fetch(`${BASE_URL}/api/settings/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, api_key: apiKey })
      });
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  },

  async deleteApiKey(provider) {
    try {
      const res = await fetch(`${BASE_URL}/api/settings/keys/${provider}`, {
        method: 'DELETE'
      });
      return await handleResponse(res);
    } catch (err) {
      handleNetworkError(err);
    }
  }
};
