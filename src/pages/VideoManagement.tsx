import { useState, useEffect, useMemo } from "react";
import { useAdminStore, Video } from "@/store/adminStore";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format } from "date-fns";

interface ApiVideo {
  videoId?: string;
  video_id?: string;
  id?: string;
  title: string;
  description: string;
  url?: string;
  youtube_url?: string;
  duration: string | number;
  category: string;
  views: number;
  status: "published" | "draft" | "archived";
  created_at: string;
  updated_at: string;
}

interface ApiVideosResponse {
  videos: ApiVideo[];
  pagination: {
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export default function VideoManagement() {
  const { videos: storeVideos, addVideo, updateVideo, deleteVideo } = useAdminStore();
  const { token } = useAuthStore();
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [apiVideos, setApiVideos] = useState<Video[]>([]);

  // Filtering and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchVideos = async () => {
    try {
      setIsLoadingVideos(true);
      const params: any = {
        p: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await apiClient.get<ApiVideosResponse>(
        API_ENDPOINTS.admin.video.list,
        {
          params,
        }
      );

      const parseDuration = (d: string | number): number => {
        if (typeof d === "number") return d;
        if (typeof d === "string" && d.includes(":")) {
          const parts = d.split(":").map(Number);
          if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
          if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
          }
        }
        return parseInt(String(d)) || 0;
      };

      const mappedVideos: Video[] = response.data.videos.map((v) => ({
        id: v.videoId || v.video_id || v.id || `temp-${Math.random()}`,
        title: v.title || "Untitled",
        description: v.description || "",
        url: v.url || v.youtube_url || "",
        youtube_url: v.youtube_url || v.url || "",
        duration: parseDuration(v.duration),
        category: v.category || "Uncategorized",
        views: v.views || 0,
        status: v.status || "draft",
        createdAt: v.created_at || new Date().toISOString(),
        updatedAt: v.updated_at || new Date().toISOString(),
      }));

      setApiVideos(mappedVideos);
      setTotalVideos(response.data.pagination.total_count);
      setTotalPages(response.data.pagination.total_pages);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      // Fallback to store videos if API fails
      setApiVideos(storeVideos);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [token, currentPage, statusFilter, searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Merge API videos with store videos (similar to UserManagement)
  const videos = useMemo(() => {
    if (apiVideos.length === 0 && !isLoadingVideos) {
      return storeVideos;
    }
    return apiVideos;
  }, [apiVideos, storeVideos, isLoadingVideos]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    duration: "",
    category: "",
    status: "draft" as "published" | "draft" | "archived",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDialog = (video?: Video) => {
    setIsViewOnly(false);
    if (video) {
      setEditingVideo(video);
      setFormData({
        title: video.title,
        description: video.description,
        url: video.url,
        duration: formatDuration(video.duration),
        category: video.category,
        status: video.status,
      });
    } else {
      setEditingVideo(null);
      setFormData({
        title: "",
        description: "",
        url: "",
        duration: "",
        category: "",
        status: "draft",
      });
    }
    setIsDialogOpen(true);
  };

  const handleViewVideo = async (video: Video) => {
    try {
      setIsLoadingVideos(true);
      const response = await apiClient.get(
        API_ENDPOINTS.admin.video.detail(video.id)
      );

      const v = response.data;
      setEditingVideo(video);
      setIsViewOnly(true);
      setFormData({
        title: v.title || video.title,
        description: v.description || video.description,
        url: v.url || v.youtube_url || video.url,
        duration: v.duration
          ? (typeof v.duration === "string" && v.duration.includes(":") ? v.duration : formatDuration(parseInt(v.duration)))
          : formatDuration(video.duration),
        category: v.category || video.category,
        status: v.status || video.status,
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch video details:", error);
      // Fallback to local data if API fails
      handleOpenDialog(video);
      setIsViewOnly(true);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVideo(null);
    setFormData({
      title: "",
      description: "",
      url: "",
      duration: "",
      category: "",
      status: "draft",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        youtube_url: formData.url,
        thumbnail_url: `https://img.youtube.com/vi/${formData.url.split("/").pop()}/maxresdefault.jpg`,
        duration: formData.duration.includes(":") ? formData.duration : formatDuration(parseInt(formData.duration)),
        tags: ["MasterMind TMS", "Load Stops", "Appointments & Scheduling"],
        target_role: [
          "Dispatchers / Route Planners",
          "Operations Coordinators / Load Planners",
          "Customer Service Representatives (Logistics)"
        ],
        timestamps: [
          { "time": "00:00:00", "label": "Introduction: Why Stops Matter in MasterMind" },
          { "time": "00:00:25", "label": "Stops Drawer Overview" },
          { "time": "00:00:55", "label": "Adding a Pick Up Stop (Delta Refractories)" },
          { "time": "00:01:35", "label": "Adding Stop References for the Pick Up" },
          { "time": "00:02:05", "label": "Adding Special Requirements for the Pick Up" },
          { "time": "00:02:35", "label": "Appointment Colors Overview (Red, Purple, Black)" },
          { "time": "00:02:55", "label": "Scenario 1: No Appointment (Red)" },
          { "time": "00:03:20", "label": "Scenario 2: Appointment Requested (Purple)" },
          { "time": "00:03:45", "label": "Scenario 3: Confirmed Appointment (Black)" },
          { "time": "00:04:10", "label": "Adding a Delivery Stop (Limited Brands DC)" },
          { "time": "00:04:45", "label": "Adding PO Reference for the Delivery" },
          { "time": "00:05:10", "label": "Delivery Requirements & Instructions" },
          { "time": "00:05:35", "label": "Setting an Open Delivery Window (October 16–17, 08:00–17:00)" },
          { "time": "00:06:10", "label": "Reviewing Both Stops in the Stops Drawer" },
          { "time": "00:06:40", "label": "Recap & Best Practices" }
        ],
        module_info: {
          module_number: "Module 4",
          module_name: "Module 1 Adding Stops to an Order",
          course_name: "Mastery Training: Module 1 Adding Stops to an Order"
        },
        production_details: {
          script_version: "Script v1.0",
          voiceover_version: "VO v1.0 (matches Script v1.0)",
          editor_notes: "Intro & Lesson Framing\nShow Mastery Training and Evans Network of Companies branding..." // Truncated for brevity
        },
        distribution: {
          lms_file_id: "TBD",
          youtube_link: formData.url
        }
      };

      if (editingVideo) {
        // Call the edit video API with PUT method
        await apiClient.put(
          API_ENDPOINTS.admin.video.update(editingVideo.id),
          payload
        );
        await fetchVideos();
        toast.success("Video updated successfully!");
      } else {
        await apiClient({
          method: "post",
          url: API_ENDPOINTS.admin.video.add,
          data: payload
        });
        await fetchVideos();
        toast.success("Video created successfully!");
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error(`Failed to ${editingVideo ? "update" : "add"} video. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(
        API_ENDPOINTS.admin.video.delete(videoToDelete)
      );

      await fetchVideos();
      toast.success("Video deleted successfully!");
      setIsDeleteDialogOpen(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete video. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setVideoToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Management</h1>
          <p className="text-muted-foreground">Manage video content and lessons</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isViewOnly ? "Video Details" : editingVideo ? "Edit Video" : "Add New Video"}</DialogTitle>
                <DialogDescription>
                  {isViewOnly
                    ? "Viewing video information details below."
                    : editingVideo
                      ? "Update video information below."
                      : "Enter the details for the new video."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    disabled={isViewOnly}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                    disabled={isViewOnly}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    disabled={isViewOnly}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (HH:MM:SS or seconds)</Label>
                    <Input
                      id="duration"
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="00:06:55"
                      required
                      disabled={isViewOnly}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      disabled={isViewOnly}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    disabled={isViewOnly}
                    onValueChange={(value: "published" | "draft" | "archived") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                {isViewOnly ? (
                  <Button
                    type="button"
                    onClick={handleCloseDialog}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                  >
                    Close
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                    >
                      {isSubmitting ? "Saving..." : editingVideo ? "Update" : "Create"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingVideos ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading videos...
                  </div>
                </TableCell>
              </TableRow>
            ) : videos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No videos found
                </TableCell>
              </TableRow>
            ) : (
              videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{video.category}</Badge>
                  </TableCell>
                  <TableCell>{formatDuration(video.duration)}</TableCell>
                  <TableCell>{(video.views ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        video.status === "published"
                          ? "default"
                          : video.status === "draft"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {video.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(video.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewVideo(video)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(video)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(video.id)}
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
      <div className="flex items-center justify-end px-2 py-4">

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || isLoadingVideos}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoadingVideos}
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
            disabled={currentPage === totalPages || totalPages === 0 || isLoadingVideos}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0 || isLoadingVideos}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle style={{ textAlign: "center" }}>
              Delete Video
            </DialogTitle>

            <DialogDescription className="py-4 text-center">
              Are you sure you want to delete this video? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
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
              {isDeleting ? "Deleting..." : "Delete Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
