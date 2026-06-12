/**
 * API Configuration
 * Centralized configuration for API base URLs and endpoints
 */

import { CloudCog } from "lucide-react";

// Base URL for the API server
// export const API_BASE_URL = "https://fireless-axel-agnostically.ngrok-free.dev/api/v1";
export const API_BASE_URL = "https://api.evanstrainer.com/api/v1";
// export const API_BASE_URL = "http://192.168.3.199:6001/api/v1";
// API Endpoints
export const API_ENDPOINTS = {
  // Admin endpoints
  admin: {
    login: `${API_BASE_URL}/admin/login`,
    logout: `${API_BASE_URL}/admin/logout`,
    changePassword: `${API_BASE_URL}/admin/change-password`,
    metrics: {
      totalVideos: `${API_BASE_URL}/admin/metrics/total-videos`,
      totalQuestions: `${API_BASE_URL}/admin/metrics/total-questions`,
      activeUsers: `${API_BASE_URL}/admin/metrics/active-users`,
      overview: `${API_BASE_URL}/admin/metrics/overview`,
    },
    users: {
      list: `${API_BASE_URL}/admin/users`,
      create: `${API_BASE_URL}/admin/users`,
      update: (userId: string) => `${API_BASE_URL}/admin/users/${userId}`,
      delete: (userId: string) => `${API_BASE_URL}/admin/users/${userId}`,
    },
    video: {
      list: `${API_BASE_URL}/admin/videos`,
      add: `${API_BASE_URL}/videos/add`,
      detail: (videoId: string) => `${API_BASE_URL}/admin/videos/${videoId}`,
      update: (videoId: string) => `${API_BASE_URL}/admin/videos/${videoId}`,
      delete: (videoId: string) => `${API_BASE_URL}/admin/videos/${videoId}`,
    },
    role: {
      list: `${API_BASE_URL}/admin/roles`,
      add: `${API_BASE_URL}/admin/roles`,
      update: (roleId: string) => `${API_BASE_URL}/admin/roles/${roleId}`,
      delete: (roleId: string) => `${API_BASE_URL}/admin/roles/${roleId}`,
    },
    // Add more admin endpoints here as needed
  },
  // Manager dashboard endpoints
  manager: {
    dashboard: {
      summary: `${API_BASE_URL}/manager/dashboard/summary`,
      learners: `${API_BASE_URL}/manager/dashboard/learners`,
      learnerReport: (learnerId: string) =>
        `${API_BASE_URL}/manager/dashboard/learner/${learnerId}/report`,
      export: `${API_BASE_URL}/manager/dashboard/export`,
    },
  },
  // Add more endpoint groups here as needed
  // users: {
  //   list: `${API_BASE_URL}/users`,
  //   create: `${API_BASE_URL}/users`,
  //   ...
  // },
} as const;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
