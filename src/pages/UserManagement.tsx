import { useState, useEffect, useMemo } from "react";
import { useAdminStore, User } from "@/store/adminStore";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format } from "date-fns";

interface ApiUser {
  id?: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  is_active: boolean;
  created_at: string | null;
}

interface ApiUsersResponse {
  users: ApiUser[];
  pagination: {
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters: {
    search: string | null;
    status: string | null;
  };
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function UserManagement() {
  const { users: storeUsers, addUser, updateUser, deleteUser } = useAdminStore();
  const { token } = useAuthStore();
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [apiUsers, setApiUsers] = useState<User[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  // Reusable function to fetch users
  const fetchUsers = async (page = 1, limit = 10) => {
    try {
      setIsLoadingUsers(true);
      const response = await apiClient.get<ApiUsersResponse>(
        API_ENDPOINTS.admin.users.list,
        {
          params: { page, limit }
        }
      );

      // Check if response.data is an array (direct listing) or paginated object
      let usersData: ApiUser[] = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data?.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;

        // Update pagination from response
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.total_pages);
          setTotalUsers(response.data.pagination.total_count);
          // Optional: Verify if we need to sync current page from server
          // setCurrentPage(response.data.pagination.page);
        }
      } else {
        console.error("Unexpected API response format:", response.data);
        toast.error("Received unexpected data format from server");
        return;
      }

      // Map API users to store User format
      const mappedUsers: User[] = usersData.map((apiUser) => {
        const firstName = apiUser.first_name || "";
        const lastName = apiUser.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || apiUser.email;
        const userId = apiUser.user_id || apiUser.id || `temp-${apiUser.email}`;

        return {
          id: userId,
          name: fullName,
          email: apiUser.email,
          role: "user", // Default role since API doesn't provide it
          status: apiUser.is_active ? "active" : "inactive",
          createdAt: apiUser.created_at || new Date().toISOString(),
          lastLogin: undefined, // Not provided by API
        };
      });

      setApiUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users from server.");
      setApiUsers([]); // Clear listing on error
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch users when token or page changes
  useEffect(() => {
    fetchUsers(currentPage, itemsPerPage);
  }, [token, currentPage]);

  // Merge API users with store users (prioritize API users, merge with store user edits)
  const users = useMemo(() => {
    if (apiUsers.length === 0) {
      return storeUsers;
    }

    return apiUsers.map(apiUser => {
      const storeUser = storeUsers.find(u => u.email === apiUser.email);
      // Merge: use API user data but keep store user's role/status if it was edited
      if (storeUser && (storeUser.role !== "user" || storeUser.status !== "active")) {
        return { ...apiUser, role: storeUser.role, status: storeUser.status };
      }
      return apiUser;
    });
  }, [apiUsers, storeUsers]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "",
    status: "active" as "active" | "inactive",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      // Split name into first and last name
      const nameParts = user.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      setFormData({
        firstName,
        lastName,
        email: user.email,
        password: "",
        phoneNumber: "",
        role: user.role,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phoneNumber: "",
        role: "",
        status: "active",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "",
      role: "",
      status: "active",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // For editing, call the PUT API
        // Check if user has a valid user_id (not null and not a temp ID)
        const userId = editingUser.id.startsWith("temp-") ? null : editingUser.id;

        if (!userId) {
          // If no valid user_id, fall back to local store update
          const existingStoreUser = storeUsers.find(u => u.id === editingUser.id || u.email === editingUser.email);
          if (existingStoreUser) {
            updateUser(existingStoreUser.id, {
              name: `${formData.firstName} ${formData.lastName}`.trim(),
              email: formData.email,
              role: formData.role,
              status: formData.status,
            });
            toast.success("User updated successfully!");
          } else {
            addUser({
              name: `${formData.firstName} ${formData.lastName}`.trim(),
              email: formData.email,
              role: formData.role,
              status: formData.status,
            });
            toast.success("User created successfully!");
          }
          handleCloseDialog();
          setIsSubmitting(false);
          return;
        }

        // Build update payload - only include password if it was provided
        const updatePayload: {
          email: string;
          first_name: string;
          last_name: string;
          phone_number: string;
          is_active: boolean;
          password?: string;
        } = {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          is_active: formData.status === "active",
        };

        // Only include password if it was provided (not empty)
        if (formData.password && formData.password.trim() !== "") {
          updatePayload.password = formData.password;
        }

        await apiClient.put(
          API_ENDPOINTS.admin.users.update(userId),
          updatePayload
        );

        // Refresh the user list after successful update
        await fetchUsers(currentPage, itemsPerPage);
        toast.success("User updated successfully!");
        handleCloseDialog();
      } else {
        // For creating new user, call the POST API
        await apiClient.post(
          API_ENDPOINTS.admin.users.create,
          {
            email: formData.email,
            password: formData.password,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber,
            is_active: formData.status === "active",
          }
        );

        // Refresh the user list after successful creation
        await fetchUsers(currentPage, itemsPerPage);
        toast.success("User created successfully!");
        handleCloseDialog();
      }
    } catch (error) {
      console.error(`Failed to ${editingUser ? "update" : "create"} user:`, error);
      toast.error(`Failed to ${editingUser ? "update" : "create"} user. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    // Check if user has a valid user_id (not null and not a temp ID)
    const userId = userToDelete.startsWith("temp-") ? null : userToDelete;

    if (!userId) {
      // If no valid user_id, fall back to local store delete
      deleteUser(userToDelete);
      toast.success("User deleted successfully!");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      setIsDeleting(false);
      return;
    }

    try {
      await apiClient.delete(
        API_ENDPOINTS.admin.users.delete(userId)
      );

      // Refresh the user list after successful deletion
      await fetchUsers(currentPage, itemsPerPage);
      toast.success("User deleted successfully!");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users and their access</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update user information below."
                    : "Enter the details for the new user."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                {!editingUser && (
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: formatPhoneNumber(e.target.value) })}
                    placeholder="(407) 307-0855"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="domestic">Domestic</SelectItem>
                      <SelectItem value="brokerage">Brokerage</SelectItem>
                      <SelectItem value="intermodal_drayage">Intermodal/Drayage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                >
                  {isSubmitting ? "Saving..." : editingUser ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "default" : "outline"}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin
                      ? format(new Date(user.lastLogin), "MMM d, yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end">
        {/* <div className="text-sm text-muted-foreground">
          Showing {users.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
        </div> */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || isLoadingUsers}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoadingUsers}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm font-medium">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || isLoadingUsers}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || isLoadingUsers}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">Delete User</DialogTitle>
            <DialogDescription className="py-4 text-center">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 justify-center flex-row">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
