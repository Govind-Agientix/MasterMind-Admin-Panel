import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Users, Video, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/store/adminStore";
import apiClient from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { useAuthStore } from "@/store/authStore";

interface DailyStat {
  date: string;
  dau: number;
  questions: number;
  videos: number;
}

interface PeakHourEntry {
  hour: number;
  label: string;
  events: number;
}

interface DayMatrix {
  day: string;
  hours: PeakHourEntry[];
  total: number;
  peak_hour: number;
  peak_hour_label: string;
  peak_hour_events: number;
}

interface DailyPeak {
  day: string;
  peak_hour: number;
  peak_hour_label: string;
  peak_hour_events: number;
  total_events: number;
}

interface PeakHours {
  matrix: DayMatrix[];
  daily_peaks: DailyPeak[];
  summary: {
    peak_day: string;
    peak_hour: number;
    peak_hour_label: string;
    peak_value: number;
    total_events: number;
    date_range: { from: string; to: string };
    days_analyzed: number;
  };
  sources: {
    chat_messages: number;
    video_events: number;
  };
}

interface OverviewResponse {
  totalActiveUsers: number;
  totalDAU: number;
  totalVideos: number;
  totalQuestions: number;
  totalPublishedVideos: number;
  dauChange: number;
  questionsChange: number;
  videosChange: number;
  dailyStats: DailyStat[];
  peakHours: PeakHours;
  timestamp: string;
}

// Show only every 3rd hour label to avoid clutter
const HOUR_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

export default function Dashboard() {
  const { videos } = useAdminStore();
  const { token } = useAuthStore();
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setIsLoadingOverview(true);
        const response = await apiClient.get<OverviewResponse>(
          API_ENDPOINTS.admin.metrics.overview
        );
        setOverviewData(response.data);
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
      } finally {
        setIsLoadingOverview(false);
      }
    };
    fetchOverview();
  }, [token]);

  const stats = useMemo(() => {
    if (overviewData) {
      return {
        activeUsers: overviewData.totalActiveUsers,
        totalVideos: overviewData.totalVideos,
        publishedVideos: overviewData.totalPublishedVideos,
        totalDAU: overviewData.totalDAU,
        dauChange: overviewData.dauChange,
        videosChange: overviewData.videosChange,
      };
    }
    return {
      activeUsers: 0,
      totalVideos: videos.length,
      publishedVideos: videos.filter(v => v.status === "published").length,
      totalDAU: 0,
      dauChange: 0,
      videosChange: 0,
    };
  }, [overviewData, videos]);

  const dauChartConfig = {
    dau: { label: "Daily Active Users", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  const videosChartConfig = {
    videos: { label: "Videos Watched", color: "hsl(217, 91%, 60%)" },
  } satisfies ChartConfig;

  const combinedChartConfig = {
    dau: { label: "Daily Active Users", color: "hsl(var(--primary))" },
    videos: { label: "Videos Watched", color: "hsl(217, 91%, 60%)" },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    if (!overviewData?.dailyStats) return [];
    return overviewData.dailyStats.map((day) => ({
      ...day,
      date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [overviewData]);

  // Compute max events across entire heatmap for color scaling
  const heatmapMax = useMemo(() => {
    if (!overviewData?.peakHours?.matrix) return 1;
    let max = 1;
    for (const day of overviewData.peakHours.matrix) {
      for (const h of day.hours) {
        if (h.events > max) max = h.events;
      }
    }
    return max;
  }, [overviewData]);

  const getHeatColor = (events: number, max: number) => {
    if (events === 0) return "bg-muted";
    const intensity = events / max;
    if (intensity < 0.25) return "bg-emerald-200 dark:bg-emerald-900";
    if (intensity < 0.5) return "bg-emerald-400 dark:bg-emerald-700";
    if (intensity < 0.75) return "bg-emerald-600 dark:bg-emerald-500";
    return "bg-emerald-800 dark:bg-emerald-300";
  };

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    description,
  }: {
    title: string;
    value: number;
    change: number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
  }) => {
    const safeChange = change ?? 0;
    const isPositive = safeChange >= 0;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(value ?? 0).toLocaleString()}</div>
          {safeChange !== 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(isPositive ? "text-green-600" : "text-red-600")}>
                {Math.abs(safeChange).toFixed(1)}%
              </span>
              <span>from last period</span>
            </div>
          )}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
      </Card>
    );
  };

  const peakHours = overviewData?.peakHours;

  return (
    <div className="space-y-6">
      {/* Top stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          change={0}
          icon={Users}
          description="Total registered active users"
        />
        <StatCard
          title="Daily Active Users"
          value={stats.totalDAU}
          change={stats.dauChange}
          icon={Users}
          description="Users active in the last 30 days"
        />
        <StatCard
          title="Total Videos"
          value={stats.totalVideos}
          change={stats.videosChange}
          icon={Video}
          description="Videos in library"
        />
        <StatCard
          title="Published Videos"
          value={stats.publishedVideos}
          change={0}
          icon={Video}
          description="Published video content"
        />
      </div>

      {/* DAU + Videos charts side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
            <CardDescription>User activity over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={dauChartConfig} className="h-[220px]">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillDau" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-dau)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-dau)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area dataKey="dau" type="monotone" fill="url(#fillDau)" fillOpacity={0.4} stroke="var(--color-dau)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Videos Activity</CardTitle>
            <CardDescription>Video uploads/views over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={videosChartConfig} className="h-[220px]">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillVideos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-videos)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-videos)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area dataKey="videos" type="monotone" fill="url(#fillVideos)" fillOpacity={0.4} stroke="var(--color-videos)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Combined overview chart */}
      <Card>
        <CardHeader>
          <CardTitle>All Metrics Overview</CardTitle>
          <CardDescription>DAU and videos compared over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={combinedChartConfig} className="h-[300px]">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillDauC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-dau)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-dau)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillVideosC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-videos)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-videos)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area dataKey="dau" type="monotone" fill="url(#fillDauC)" fillOpacity={0.4} stroke="var(--color-dau)" stackId="a" />
              <Area dataKey="videos" type="monotone" fill="url(#fillVideosC)" fillOpacity={0.4} stroke="var(--color-videos)" stackId="b" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Peak Hours Heatmap */}
      {peakHours && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Peak Activity Hours
                </CardTitle>
                <CardDescription>
                  Hourly engagement heatmap — {peakHours.summary.days_analyzed} days analysed
                  ({peakHours.summary.date_range.from} to {peakHours.summary.date_range.to})
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-emerald-800 dark:bg-emerald-300" />
                  High
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                  Med-High
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                  Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                  Low
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-muted" />
                  None
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <div className="rounded-md bg-muted px-3 py-1.5">
                <span className="text-muted-foreground">Peak day: </span>
                <span className="font-semibold">{peakHours.summary.peak_day}</span>
              </div>
              <div className="rounded-md bg-muted px-3 py-1.5">
                <span className="text-muted-foreground">Peak hour: </span>
                <span className="font-semibold">{peakHours.summary.peak_hour_label}</span>
              </div>
              <div className="rounded-md bg-muted px-3 py-1.5">
                <span className="text-muted-foreground">Total events: </span>
                <span className="font-semibold">{peakHours.summary.total_events}</span>
              </div>
              <div className="rounded-md bg-muted px-3 py-1.5">
                <span className="text-muted-foreground">Video events: </span>
                <span className="font-semibold">{peakHours.sources.video_events}</span>
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hour axis labels */}
                <div className="flex items-center mb-1 pl-20">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 text-center">
                      {i % 3 === 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {HOUR_LABELS[i / 3]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Day rows */}
                {peakHours.matrix.map((dayRow) => (
                  <div key={dayRow.day} className="flex items-center mb-1 gap-1">
                    <div className="w-20 shrink-0 text-xs text-muted-foreground font-medium text-right pr-2">
                      {dayRow.day.slice(0, 3)}
                    </div>
                    <div className="flex flex-1 gap-[2px]">
                      {dayRow.hours.map((h) => (
                        <div
                          key={h.hour}
                          title={`${dayRow.day} ${h.label}: ${h.events} event${h.events !== 1 ? "s" : ""}`}
                          className={cn(
                            "flex-1 h-6 rounded-[3px] cursor-default transition-opacity hover:opacity-80",
                            getHeatColor(h.events, heatmapMax)
                          )}
                        />
                      ))}
                    </div>
                    <div className="w-8 shrink-0 text-[10px] text-muted-foreground text-right">
                      {dayRow.total}
                    </div>
                  </div>
                ))}

                {/* Per-day peak summary bar */}
                <div className="flex items-center mt-3 gap-1">
                  <div className="w-20 shrink-0 text-[10px] text-muted-foreground text-right pr-2">
                    Peak
                  </div>
                  <div className="flex flex-1 gap-[2px]">
                    {peakHours.daily_peaks.map((dp) => (
                      <div
                        key={dp.day}
                        title={`${dp.day} peak: ${dp.peak_hour_label} (${dp.peak_hour_events} events)`}
                        className="flex-1 text-center"
                      >
                        <span className="text-[9px] text-muted-foreground leading-none">
                          {dp.total_events > 0 ? dp.peak_hour_label.replace(" ", "") : "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="w-8 shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
