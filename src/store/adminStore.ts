import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  category: string;
  views: number;
  status: "published" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
  youtube_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  target_role?: string[];
  module_info?: {
    module_number: string;
    module_name: string;
    course_name: string;
  };
  production_details?: {
    script_version: string;
    voiceover_version: string;
    editor_notes: string;
  };
}

export interface Question {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  askedCount: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
  agent_id?: string;
}

interface AdminState {
  // Users
  users: User[];
  addUser: (user: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Videos
  videos: Video[];
  addVideo: (video: Omit<Video, "id" | "createdAt" | "updatedAt" | "views">) => void;
  updateVideo: (id: string, video: Partial<Video>) => void;
  deleteVideo: (id: string) => void;

  // Questions
  questions: Question[];
  addQuestion: (question: Omit<Question, "id" | "createdAt" | "updatedAt" | "askedCount">) => void;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;

  // Roles
  roles: Role[];
  addRole: (role: Omit<Role, "id" | "createdAt" | "userCount">) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  // Reset
  resetStore: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Initial mock data
const initialUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "user",
    status: "active",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "user",
    status: "inactive",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialVideos: Video[] = [
  {
    id: "1",
    title: "Getting Started with AI Training",
    description: "Learn the basics of using our AI training assistant",
    url: "https://example.com/video1",
    duration: 300,
    category: "Tutorial",
    views: 1250,
    status: "published",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    title: "Advanced Features Guide",
    description: "Explore advanced features and capabilities",
    url: "https://example.com/video2",
    duration: 450,
    category: "Advanced",
    views: 890,
    status: "published",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "Troubleshooting Common Issues",
    description: "Solutions to frequently encountered problems",
    url: "https://example.com/video3",
    duration: 200,
    category: "Support",
    views: 567,
    status: "draft",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialQuestions: Question[] = [
  {
    id: "1",
    question: "How do I reset my password?",
    answer: "You can reset your password by clicking on 'Forgot Password' on the login page.",
    category: "Account",
    tags: ["password", "account", "security"],
    status: "active",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    askedCount: 45,
  },
  {
    id: "2",
    question: "What features are available in the AI trainer?",
    answer: "The AI trainer includes voice chat, video lessons, and interactive Q&A sessions.",
    category: "Features",
    tags: ["features", "ai", "trainer"],
    status: "active",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    askedCount: 32,
  },
  {
    id: "3",
    question: "How can I contact support?",
    answer: "You can reach our support team through the help center or email support@example.com",
    category: "Support",
    tags: ["support", "contact", "help"],
    status: "active",
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    askedCount: 28,
  },
];

const initialRoles: Role[] = [
  {
    id: "1",
    name: "Admin",
    description: "Full access to all features and settings",
    permissions: ["users:read", "users:write", "videos:read", "videos:write", "questions:read", "questions:write", "roles:read", "roles:write"],
    userCount: 1,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "User",
    description: "Standard user access to training features",
    permissions: ["videos:read", "questions:read"],
    userCount: 2,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Moderator",
    description: "Can manage content and moderate questions",
    permissions: ["videos:read", "videos:write", "questions:read", "questions:write"],
    userCount: 0,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      users: initialUsers,
      videos: initialVideos,
      questions: initialQuestions,
      roles: initialRoles,

      // User management
      addUser: (user) =>
        set((state) => ({
          users: [
            ...state.users,
            {
              ...user,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...updates } : user
          ),
        })),

      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        })),

      // Video management
      addVideo: (video) =>
        set((state) => ({
          videos: [
            ...state.videos,
            {
              ...video,
              id: generateId(),
              views: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateVideo: (id, updates) =>
        set((state) => ({
          videos: state.videos.map((video) =>
            video.id === id
              ? { ...video, ...updates, updatedAt: new Date().toISOString() }
              : video
          ),
        })),

      deleteVideo: (id) =>
        set((state) => ({
          videos: state.videos.filter((video) => video.id !== id),
        })),

      // Question management
      addQuestion: (question) =>
        set((state) => ({
          questions: [
            ...state.questions,
            {
              ...question,
              id: generateId(),
              askedCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateQuestion: (id, updates) =>
        set((state) => ({
          questions: state.questions.map((question) =>
            question.id === id
              ? { ...question, ...updates, updatedAt: new Date().toISOString() }
              : question
          ),
        })),

      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((question) => question.id !== id),
        })),

      // Role management
      addRole: (role) =>
        set((state) => ({
          roles: [
            ...state.roles,
            {
              ...role,
              id: generateId(),
              userCount: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateRole: (id, updates) =>
        set((state) => ({
          roles: state.roles.map((role) =>
            role.id === id ? { ...role, ...updates } : role
          ),
        })),

      deleteRole: (id) =>
        set((state) => ({
          roles: state.roles.filter((role) => role.id !== id),
        })),

      // Reset store
      resetStore: () =>
        set({
          users: initialUsers,
          videos: initialVideos,
          questions: initialQuestions,
          roles: initialRoles,
        }),
    }),
    {
      name: "admin-storage",
    }
  )
);
