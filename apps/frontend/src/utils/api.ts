export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure JSON content type if body is present and not FormData
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${import.meta.env.VITE_API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Handle token expiration globally
  if (response.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  }

  return response;
};
