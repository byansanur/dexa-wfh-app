export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    ...options.headers,
  } as Record<string, string>;

  // Ensure JSON content type if body is present and not FormData
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${import.meta.env.VITE_API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: headers as HeadersInit,
    credentials: 'include', // Automatically send cookies
  });

  // Handle token expiration globally
  if (response.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  return response;
};
