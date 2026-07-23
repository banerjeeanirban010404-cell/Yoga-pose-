const getApiBaseUrl = () => {
  const { hostname, port, origin } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  const isDevServer = isLocal && port !== '8000' && port !== '';
  if (isDevServer) {
    return 'http://127.0.0.1:8000/api/v1';
  }
  return `${origin}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

// Helpers to handle tokens
const getToken = () => localStorage.getItem('yoga_pose_ai_token');
const setToken = (token) => localStorage.setItem('yoga_pose_ai_token', token);
const removeToken = () => localStorage.removeItem('yoga_pose_ai_token');

// Base fetch request helper with authorization header
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // If unauthorized, clear token
    removeToken();
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Request failed');
  }

  return data;
}

export const api = {
  // Authentication
  async login(username, password) {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    setToken(data.access_token);
    return data;
  },

  async signup(username, email, password) {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  logout() {
    removeToken();
  },

  async getMe() {
    return request('/auth/me');
  },

  isAuthenticated() {
    return !!getToken();
  },

  // Poses and Exercises
  async getLibrary(searchQuery = '') {
    const qParam = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery)}` : '';
    return request(`/library${qParam}`);
  },

  async getRelatedItems(itemId) {
    return request(`/library/${itemId}/related`);
  },

  async getPoses() {
    return request('/poses');
  },

  async getPose(poseId) {
    return request(`/poses/${poseId}`);
  },

  async getExercises() {
    return request('/exercises');
  },

  async getExercise(exerciseId) {
    return request(`/exercises/${exerciseId}`);
  },

  // Sessions
  async logSession(sessionData) {
    return request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  async getSessions() {
    return request('/sessions');
  },

  // Custom Flows
  async saveFlow(flowData) {
    return request('/sessions/flows', {
      method: 'POST',
      body: JSON.stringify(flowData),
    });
  },

  async getFlows() {
    return request('/sessions/flows');
  },

  async deleteFlow(flowId) {
    return request(`/sessions/flows/${flowId}`, {
      method: 'DELETE',
    });
  },

  // Dashboard Statistics
  async getDashboard() {
    return request('/dashboard');
  },

  async clearDashboard() {
    return request('/dashboard/clear', {
      method: 'POST',
    });
  },

  // Pose Analysis
  async analyzePose(poseId, landmarks, sessionId = null) {
    return request('/trainer/analyze', {
      method: 'POST',
      body: JSON.stringify({ pose_id: poseId, landmarks, session_id: sessionId }),
    });
  },

  async getBiomechanicalExplanation(poseId, jointName, deviationDegrees) {
    return request('/trainer/explain', {
      method: 'POST',
      body: JSON.stringify({
        pose_id: poseId,
        joint_name: jointName,
        deviation_degrees: deviationDegrees
      }),
    });
  },

  // Check if backend is reachable
  async checkStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/status`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return data.status === 'online';
      }
      return false;
    } catch (e) {
      return false;
    }
  }
};
