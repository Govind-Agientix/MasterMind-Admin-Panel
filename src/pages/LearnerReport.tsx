import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, AlertTriangle } from "lucide-react";
import apiClient from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface LearnerReportResponse {
  profile: {
    id: string;
    name: string;
    email: string;
    joined: string;
  };
  tutorials_completed: {
    module_id: string;
    session_id: string;
    score: number;
    total: number;
    percentage: number;
    created_at: string;
  }[];
  roleplay_history: {
    module_id: string;
    score: number;
    total: number;
    percentage: number;
    created_at: string;
  }[];
  weak_areas: { module_id: string; avg_score: number }[];
  module_progress: {
    current_module: number;
    total_modules: number;
    completed_count: number;
    modules: { module_number: number; module_name: string; is_completed: boolean }[];
  } | null;
  recent_videos: {
    video_id: string;
    event: string;
    progress_seconds: number;
    timestamp: string;
  }[];
  learning_behaviors: {
    event_type: string;
    summary: string;
    created_at: string;
  }[];
}

const scoreChartConfig = {
  percentage: { label: "Score %", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export default function LearnerReport() {
  const { learnerId } = useParams<{ learnerId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<LearnerReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!learnerId) {
      setError("Missing learner ID");
      setLoading(false);
      return;
    }
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<LearnerReportResponse>(
          API_ENDPOINTS.manager.dashboard.learnerReport(learnerId)
        );
        setReport(res.data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setError("Learner not found");
          toast.error("Learner not found");
        } else {
          setError("Failed to load report");
          toast.error("Failed to load learner report");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [learnerId]);

  const scoreOverTimeData = useMemo(() => {
    if (!report?.roleplay_history?.length) return [];
    return report.roleplay_history
      .map((r) => ({
        ...r,
        dateLabel: format(new Date(r.created_at), "MMM d, HH:mm"),
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [report?.roleplay_history]);

  const progressPercent =
    report?.module_progress && report.module_progress.total_modules > 0
      ? Math.round(
          (report.module_progress.completed_count / report.module_progress.total_modules) * 100
        )
      : 0;

  const activityItems = useMemo(() => {
    if (!report) return [];
    const videos = (report.recent_videos || []).map((v) => ({
      type: "video" as const,
      key: `${v.video_id}-${v.timestamp}`,
      label: `Video ${v.event} at ${format(new Date(v.timestamp), "MMM d, HH:mm")} (${Math.round(v.progress_seconds)}s)`,
      created_at: v.timestamp,
    }));
    const behaviors = (report.learning_behaviors || []).map((b) => ({
      type: "behavior" as const,
      key: `${b.event_type}-${b.created_at}`,
      label: b.summary,
      created_at: b.created_at,
    }));
    return [...videos, ...behaviors].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [report]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12 min-w-0">
        <p className="text-sm sm:text-base text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4 min-w-0">
        <Button variant="ghost" onClick={() => navigate("/manager")} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
          Back to Manager Dashboard
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm sm:text-base px-4 sm:px-6">
            {error || "Unable to load report"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <Button variant="ghost" onClick={() => navigate("/manager")} className="w-full sm:w-auto shrink-0">
        <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
        Back to Manager Dashboard
      </Button>

      {/* Profile */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-5 w-5 shrink-0" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4 sm:px-6">
          <p className="text-sm sm:text-base break-words">
            <span className="font-medium">Name:</span> {report.profile.name}
          </p>
          <p className="text-sm sm:text-base break-all">
            <span className="font-medium">Email:</span> {report.profile.email}
          </p>
          <p className="text-sm sm:text-base">
            <span className="font-medium">Joined:</span>{" "}
            {format(new Date(report.profile.joined), "PPP")}
          </p>
        </CardContent>
      </Card>

      {/* Module progress */}
      {report.module_progress && (
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Module Progress</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {report.module_progress.completed_count} of {report.module_progress.total_modules} modules completed
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {report.module_progress.modules?.length > 0 && (
                <ul className="mt-2 text-xs sm:text-sm text-muted-foreground space-y-1 break-words">
                  {report.module_progress.modules.map((m) => (
                    <li key={m.module_number}>
                      Module {m.module_number}: {m.module_name}{" "}
                      {m.is_completed && <Badge variant="secondary" className="ml-1">Done</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score over time (line chart) */}
      {scoreOverTimeData.length > 0 && (
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Score Over Time</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Roleplay / quiz scores by date</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 overflow-x-auto">
            <ChartContainer config={scoreChartConfig} className="h-[250px] sm:h-[300px] min-w-[280px]">
              <LineChart data={scoreOverTimeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="dateLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--color-percentage)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Weak areas */}
      {report.weak_areas?.length > 0 && (
        <Card className="border-destructive/50 min-w-0 overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Weak Areas (avg score &lt; 70%)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ul className="space-y-2">
              {report.weak_areas.map((w) => (
                <li key={w.module_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm break-words">
                  <span className="min-w-0">{w.module_id}</span>
                  <Badge variant="destructive" className="w-fit shrink-0">{w.avg_score}% avg</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tutorials completed */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Tutorials Completed</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Quiz / tutorial completion history</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {report.tutorials_completed?.length ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border">
              <Table className="[&_th]:px-3 [&_th]:sm:px-4 [&_td]:px-3 [&_td]:sm:px-4">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Module</TableHead>
                    <TableHead className="whitespace-nowrap">Session</TableHead>
                    <TableHead className="whitespace-nowrap">Score</TableHead>
                    <TableHead className="whitespace-nowrap">%</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.tutorials_completed.map((t, i) => (
                    <TableRow key={`${t.module_id}-${t.session_id}-${i}`}>
                      <TableCell className="min-w-[80px]">{t.module_id}</TableCell>
                      <TableCell className="font-mono text-xs min-w-[120px] max-w-[180px] truncate" title={t.session_id}>{t.session_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{t.score} / {t.total}</TableCell>
                      <TableCell className="whitespace-nowrap">{t.percentage}%</TableCell>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm">{format(new Date(t.created_at), "PPp")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tutorials completed yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Activity log */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Activity Log</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Recent videos and learning behaviors</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {activityItems.length ? (
            <ul className="space-y-3">
              {activityItems.slice(0, 20).map((item) => (
                <li key={item.key} className="flex flex-col gap-0.5 text-xs sm:text-sm break-words">
                  <span className="text-muted-foreground shrink-0">
                    {format(new Date(item.created_at), "PPp")}
                  </span>
                  <span className="min-w-0">{item.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
