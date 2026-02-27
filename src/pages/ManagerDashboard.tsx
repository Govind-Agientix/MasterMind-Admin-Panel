import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, BookOpen, TrendingUp, Percent, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import apiClient from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "sonner";

// API types
interface DashboardSummary {
  active_learners_this_week: number;
  total_tutorials_completed: number;
  platform_avg_score: number | null;
  completion_rate: number;
  hardest_workflows: { workflow: string; avg_score: number; attempts: number }[];
  most_replayed_videos: { tutorial: string; replays: number }[];
}

interface Learner {
  id: string;
  name: string;
  email: string;
  tutorials_completed: number;
  avg_score: number | null;
  last_active: string | null;
}

interface LearnersResponse {
  learners: Learner[];
  pagination: {
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
  };
}

const hardWorkflowsConfig = {
  avg_score: { label: "Avg Score", color: "hsl(var(--primary))" },
  attempts: { label: "Attempts", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

const replaysConfig = {
  replays: { label: "Replays", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [learnersLoading, setLearnersLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState<LearnersResponse["pagination"] | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await apiClient.get<DashboardSummary>(API_ENDPOINTS.manager.dashboard.summary);
      setSummary(res.data);
    } catch (err: unknown) {
      console.error("Failed to fetch dashboard summary:", err);
      toast.error("Failed to load dashboard summary");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchLearners = useCallback(async () => {
    try {
      setLearnersLoading(true);
      const res = await apiClient.get<LearnersResponse>(API_ENDPOINTS.manager.dashboard.learners, {
        params: { page, limit, ...(search ? { search } : {}) },
      });
      setLearners(res.data.learners);
      setPagination(res.data.pagination);
    } catch (err: unknown) {
      console.error("Failed to fetch learners:", err);
      toast.error("Failed to load learners");
    } finally {
      setLearnersLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchLearners();
  }, [fetchLearners]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const res = await apiClient.get(API_ENDPOINTS.manager.dashboard.export, {
        responseType: "blob",
      });
      const disposition = res.headers["content-disposition"];
      const filename =
        (disposition && /filename="?([^";\n]+)"?/.exec(disposition)?.[1]) || "evans_training_report.csv";
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (err: unknown) {
      console.error("Export failed:", err);
      toast.error("Failed to export report");
    } finally {
      setExportLoading(false);
    }
  };

  const handleLearnerClick = (learnerId: string) => {
    navigate(`/manager/learners/${learnerId}`);
  };

  const totalPages = pagination?.total_pages ?? 1;
  const totalCount = pagination?.total_count ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold truncate min-w-0">Manager Dashboard</h1>
        <Button onClick={handleExport} disabled={exportLoading} variant="outline" className="w-full sm:w-auto shrink-0">
          <Download className="h-4 w-4 mr-2 shrink-0" />
          {exportLoading ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium truncate pr-2">Active Learners (This Week)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {summaryLoading ? "—" : summary?.active_learners_this_week ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium truncate pr-2">Tutorials Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {summaryLoading ? "—" : summary?.total_tutorials_completed ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium truncate pr-2">Platform Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {summaryLoading ? "—" : summary?.platform_avg_score != null ? `${summary.platform_avg_score}%` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium truncate pr-2">Completion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {summaryLoading ? "—" : `${summary?.completion_rate ?? 0}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 min-w-0">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Hardest Workflows</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Average score by workflow (tooltip: attempts)</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 overflow-x-auto">
            <ChartContainer config={hardWorkflowsConfig} className="h-[250px] sm:h-[300px] min-w-[280px]">
              <BarChart
                data={summary?.hardest_workflows ?? []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="workflow" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <div className="font-medium">{p.workflow}</div>
                        <div>Avg Score: {p.avg_score}</div>
                        <div>Attempts: {p.attempts}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="avg_score" fill="var(--color-avg_score)" radius={4} name="Avg Score" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Most Replayed Videos</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Replay count by tutorial</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 overflow-x-auto">
            <ChartContainer config={replaysConfig} className="h-[250px] sm:h-[300px] min-w-[280px]">
              <BarChart
                data={summary?.most_replayed_videos ?? []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="tutorial" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="replays" fill="var(--color-replays)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Learners table */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">All Learners</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Click a row to view the learner report</CardDescription>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 w-full"
              />
            </div>
            <Button onClick={handleSearch} variant="secondary" className="w-full sm:w-auto shrink-0">
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {learnersLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm sm:text-base">Loading learners...</div>
          ) : learners.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm sm:text-base">No learners found</div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border">
                <Table className="[&_th]:px-3 [&_th]:sm:px-4 [&_td]:px-3 [&_td]:sm:px-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Tutorials</TableHead>
                      <TableHead className="whitespace-nowrap">Avg Score</TableHead>
                      <TableHead className="whitespace-nowrap">Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learners.map((learner) => (
                      <TableRow
                        key={learner.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleLearnerClick(learner.id)}
                      >
                        <TableCell className="font-medium min-w-[100px] max-w-[140px] sm:max-w-none truncate" title={learner.name}>{learner.name}</TableCell>
                        <TableCell className="min-w-[120px] max-w-[160px] sm:max-w-none truncate" title={learner.email}>{learner.email}</TableCell>
                        <TableCell className="whitespace-nowrap">{learner.tutorials_completed}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {learner.avg_score != null ? `${learner.avg_score}%` : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                          {learner.last_active
                            ? new Date(learner.last_active).toLocaleString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
                <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                  Page {page} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2 justify-center sm:justify-end order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
