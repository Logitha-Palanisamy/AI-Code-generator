import axios from "axios";

const client = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Necessary to send and receive HTTP-Only refresh cookies
});

// Secure in-memory token storage (never persisted to localStorage)
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// Request Interceptor: Attach bearer token to outgoing API calls
client.interceptors.request.use(
  (config) => {
    const authHeader = inMemoryAccessToken ? `Bearer ${inMemoryAccessToken}` : null;
    if (config.headers) {
      if (authHeader) {
        config.headers.Authorization = authHeader;
      } else {
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token Refresh State Management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Catch 401s, rotate tokens, queue requests, or log out
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle expired tokens (401 response status)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Trigger backend HTTP-Only token rotation endpoint
        const refreshResponse = await axios.post(
          "/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        );
        const { access_token } = refreshResponse.data;
        
        setAccessToken(access_token);
        processQueue(null, access_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return client(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        
        // Notify the AuthContext to wipe state and redirect
        window.dispatchEvent(new Event("auth:unauthorized"));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default client;
