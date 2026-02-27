import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { API_ENDPOINTS } from "@/config/api";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (email: string, password: string) => {
        try {
          const response = await axios.post(API_ENDPOINTS.admin.login, {
            email,
            password,
          });

          // Handle successful response
          // Response structure: { access_token, admin: { admin_id, email, first_name, last_name } }
          const responseData = response.data;
          const accessToken = responseData.access_token;
          const adminData = responseData.admin;

          if (accessToken && adminData) {
            // Combine first_name and last_name for full name
            const fullName = [adminData.first_name, adminData.last_name]
              .filter(Boolean)
              .join(" ")
              .trim() || "Admin User";

            const user: AdminUser = {
              id: adminData.id ?? adminData.admin_id,
              email: adminData.email,
              name: fullName,
              role: "admin", // Default role for admin users
            };

            // Set default authorization header for future requests
            axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

            set({
              isAuthenticated: true,
              user,
              token: accessToken,
            });

            return { success: true };
          } else {
            return {
              success: false,
              error: "Invalid response from server",
            };
          }
        } catch (error: any) {
          // Handle error response
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Invalid email or password";

          return {
            success: false,
            error: errorMessage,
          };
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        try {
          const { token } = get();

          if (!token) {
            return {
              success: false,
              error: "Not authenticated",
            };
          }

          const response = await axios.post(
            API_ENDPOINTS.admin.changePassword,
            {
              old_password: oldPassword,
              new_password: newPassword,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Handle successful response
          return { success: true };
        } catch (error: any) {
          // Handle error response
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Failed to change password";

          return {
            success: false,
            error: errorMessage,
          };
        }
      },

      logout: () => {
        // Clear authorization header
        delete axios.defaults.headers.common["Authorization"];

        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      },
    }),
    {
      name: "auth-storage",
      // Restore axios auth header on rehydration
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
