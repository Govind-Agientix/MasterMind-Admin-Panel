import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Video, MessageSquare, Shield, Menu, X, LogOut, User, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import ChangePasswordDialog from "./ChangePasswordDialog";
import apiClient from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Videos", href: "/videos", icon: Video },
  // { name: "Questions", href: "/questions", icon: MessageSquare },
  { name: "Roles", href: "/roles", icon: Shield },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { user, logout, token } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post(
        API_ENDPOINTS.admin.logout,
        {}
      );
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      // We still want to clear local state even if server logout fails
      toast.error("Logout failed on server, clearing local session");
    } finally {
      logout();
      navigate("/login");
      setIsLoggingOut(false);
      setIsLogoutDialogOpen(false);
    }
  };

  const confirmLogout = () => {
    setIsLogoutDialogOpen(true);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r">
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <div className="pt-4 mt-4 border-t">
              <div className="px-4 py-2 mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.name || "Admin"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setChangePasswordOpen(true);
                  setSidebarOpen(false);
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  confirmLogout();
                  setSidebarOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center border-b">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <nav className="flex flex-1 flex-col pt-6">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto pt-4 border-t">
              <div className="px-4 py-2 mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.name || "Admin"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setChangePasswordOpen(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={confirmLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.name || "Admin"}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChangePasswordOpen(true)}
              className="hidden sm:flex"
            >
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={confirmLogout}
              className="hidden sm:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">Logout</DialogTitle>
            <DialogDescription className="py-4 text-center">
              Are you sure you want to logout?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 justify-center flex-row">
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
