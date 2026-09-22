// DataWatch — API Client (Axios)
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // 2 min for large CSV analysis
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor (for future auth headers)
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error("Unable to connect to DataWatch monitoring service. Check that the FastAPI backend is running.")
      );
    }
    const message =
      error.response.data?.detail ||
      error.response.data?.error ||
      `Request failed with status ${error.response.status}`;
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
