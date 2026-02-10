import axios from "axios";
import { API_BASE_URL } from "@/config/api";
import { useAuthStore } from "@/store/authStore";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor to add the auth token to every request
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add ngrok skip warning header
        config.headers["ngrok-skip-browser-warning"] = "true";

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // customized error handling if needed, e.g. logout
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default apiClient;
