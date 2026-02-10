import { useState, useEffect, useMemo } from "react";
import { useAdminStore, Role } from "@/store/adminStore";
import { Button } from "@/components/ui/button";
import axios from "axios";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format } from "date-fns";

const availablePermissions = [
  "users:read",
  "users:write",
  "videos:read",
  "videos:write",
  "questions:read",
  "questions:write",
  "roles:read",
  "roles:write",
];

interface ApiRole {
  id: string;
  agent_id: string;
  name: string;
  instruction: string;
  created_at?: string;
  updated_at?: string;
}

interface ApiRolesResponse {
  roles: ApiRole[];
  pagination: {
    offset: number;
    limit: number;
    total_count: number;
  };
}

export default function RoleManagement() {
  const { roles: storeRoles, addRole, updateRole, deleteRole } = useAdminStore();
  const { token } = useAuthStore();
  const [apiRoles, setApiRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    agent_id: "",
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRoles, setTotalRoles] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const offset = (currentPage - 1) * pageSize;
      const response = await axios.get<ApiRolesResponse>(
        API_ENDPOINTS.admin.role.list,
        {
          params: { offset, limit: pageSize },
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      // Handle both direct array or nested roles array
      const rawRoles = response.data.roles || [];
      const totalCount = response.data.pagination?.total_count || rawRoles.length;

      setTotalRoles(totalCount);
      setTotalPages(Math.ceil(totalCount / pageSize));

      const mappedRoles: Role[] = rawRoles.map((r: ApiRole) => ({
        id: r.agent_id || r.id, // Use agent_id as the primary ID for UI/API consistency
        agent_id: r.agent_id,
        name: r.name,
        description: r.instruction || "",
        permissions: [],
        userCount: 0,
        createdAt: r.created_at || "",
        updatedAt: r.updated_at || "",
      }));

      setApiRoles(mappedRoles);
      setHasFetched(true);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      if (!hasFetched) {
        setApiRoles(storeRoles);
      }
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [token, currentPage]);

  const roles = useMemo(() => {
    // If we've never successfully fetched, show store roles as fallback
    if (!hasFetched && apiRoles.length === 0) return storeRoles;
    // Once we've fetched, trust the API data even if it's empty
    return apiRoles;
  }, [apiRoles, storeRoles, hasFetched]);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        agent_id: role.agent_id || "",
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });
    } else {
      setEditingRole(null);
      setFormData({
        agent_id: "",
        name: "",
        description: "",
        permissions: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setFormData({
      agent_id: "",
      name: "",
      description: "",
      permissions: [],
    });
  };

  const handleTogglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await axios.put(
          API_ENDPOINTS.admin.role.update(editingRole.id),
          {
            name: formData.name,
            instruction: formData.description,
          },
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        toast.success("Role updated successfully!");
        await fetchRoles();
      } else {
        await axios.post(
          API_ENDPOINTS.admin.role.add,
          {
            agent_id: formData.agent_id,
            name: formData.name,
            instruction: formData.description,
          },
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        toast.success("Role created successfully!");
        await fetchRoles();
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error(`Failed to ${editingRole ? "update" : "add"} role. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(
        API_ENDPOINTS.admin.role.delete(roleToDelete),
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "ngrok-skip-browser-warning": "true",
          }
        }
      );

      await fetchRoles();
      toast.success("Role deleted successfully!");
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete role. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setRoleToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRole ? "Edit Role" : "Add New Role"}</DialogTitle>
                <DialogDescription>
                  {editingRole
                    ? "Update role information and permissions below."
                    : "Enter the details for the new role."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="agent_id">Agent ID</Label>
                  <Input
                    id="agent_id"
                    value={formData.agent_id}
                    onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                    placeholder="e.g., customer_manager"
                    required
                    disabled={!!editingRole}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Instruction</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Enter role guidelines and instructions..."
                    required
                  />
                </div>
                {/* <div className="grid gap-2">
                  <Label>Permissions</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                    {availablePermissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => handleTogglePermission(permission)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div> */}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                >
                  {isSubmitting ? "Saving..." : editingRole ? "Update" : "Create"}
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
              <TableHead>Description</TableHead>
              {/* <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead> */}
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRoles ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading roles...
                  </div>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate">{role.description}</div>
                  </TableCell>
                  {/* <TableCell>
                    {role.permissions && role.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {role.userCount > 0 ? role.userCount : <span className="text-muted-foreground">N/A</span>}
                  </TableCell> */}
                  <TableCell>
                    {role.createdAt ? (
                      format(new Date(role.createdAt), "MMM d, yyyy")
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(role.id)}
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

      <div className="flex items-center justify-end border-t p-4">

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || isLoadingRoles}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoadingRoles}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center min-w-[32px] text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0 || isLoadingRoles}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0 || isLoadingRoles}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">Delete Role</DialogTitle>
            <DialogDescription className="py-4 text-center">
              Are you sure you want to delete this role? This action cannot be undone.
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
              {isDeleting ? "Deleting..." : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
