import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Users, MessageSquare, Video, TrendingUp, TrendingDown } from "lucide-react";
import { generateMockData } from "@/lib/mockData";
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

interface OverviewResponse {
  totalDAU: number;
  totalQuestions: number;
  totalVideos: number;
  dauChange: number;
  questionsChange: number;
  videosChange: number;
  dailyStats: DailyStat[];
  timestamp: string;
}

export default function Dashboard() {
  const mockStats = useMemo(() => generateMockData(), []);
  const { users, videos, questions } = useAdminStore();
  const { token } = useAuthStore();
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // Fetch overview data from API
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
        // On error, keep overviewData as null to use fallback values
      } finally {
        setIsLoadingOverview(false);
      }
    };

    fetchOverview();
  }, [token]);

  // Calculate stats - use API data if available, otherwise fallback to store/mock data
  const realStats = useMemo(() => {
    if (overviewData) {
      return {
        activeUsers: Math.round(overviewData.totalDAU),
        totalQuestions: Math.round(overviewData.totalQuestions),
        totalVideos: Math.round(overviewData.totalVideos),
        publishedVideos: videos.filter(v => v.status === "published").length,
      };
    }

    // Fallback to store values
    return {
      activeUsers: users.filter(u => u.status === "active").length,
      totalQuestions: questions.length,
      totalVideos: videos.length,
      publishedVideos: videos.filter(v => v.status === "published").length,
    };
  }, [overviewData, users, videos, questions]);

  // Use API overview data for trends, fallback to mock data
  const trendStats = useMemo(() => {
    if (overviewData) {
      return {
        totalDAU: overviewData.totalDAU,
        totalQuestions: overviewData.totalQuestions,
        totalVideos: overviewData.totalVideos,
        dauChange: overviewData.dauChange,
        questionsChange: overviewData.questionsChange,
        videosChange: overviewData.videosChange,
      };
    }
    return {
      totalDAU: mockStats.totalDAU,
      totalQuestions: mockStats.totalQuestions,
      totalVideos: mockStats.totalVideos,
      dauChange: mockStats.dauChange,
      questionsChange: mockStats.questionsChange,
      videosChange: mockStats.videosChange,
    };
  }, [overviewData, mockStats]);

  const dauChartConfig = {
    dau: {
      label: "Daily Active Users",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const questionsChartConfig = {
    questions: {
      label: "Questions Asked",
      color: "hsl(var(--accent))",
    },
  } satisfies ChartConfig;

  const videosChartConfig = {
    videos: {
      label: "Videos Watched",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const combinedChartConfig = {
    dau: {
      label: "Daily Active Users",
      color: "hsl(var(--primary))",
    },
    questions: {
      label: "Questions Asked",
      color: "hsl(var(--accent))",
    },
    videos: {
      label: "Videos Watched",
      color: "hsl(217, 91%, 60%)",
    },
  } satisfies ChartConfig;

  // Format dates for display - use API data if available, otherwise use mock data
  const chartData = useMemo(() => {
    const dailyStats = overviewData?.dailyStats || mockStats.dailyStats;
    return dailyStats.map((day) => ({
      ...day,
      date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [overviewData, mockStats]);

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    description,
    showDecimal = false,
  }: {
    title: string;
    value: number;
    change: number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    showDecimal?: boolean;
  }) => {
    const safeValue = value ?? 0;
    const safeChange = change ?? 0;
    const isPositive = safeChange >= 0;
    const formattedValue = showDecimal
      ? safeValue.toFixed(1)
      : safeValue % 1 === 0
        ? safeValue.toLocaleString()
        : safeValue.toFixed(1);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          {safeChange !== 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(isPositive ? "text-green-600" : "text-red-600")}>
                {Math.abs(safeChange).toFixed(1)}%
              </span>
              <span>from last week</span>
            </div>
          )}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Active Users"
          value={realStats.activeUsers}
          change={0}
          icon={Users}
          description="Currently active users"
        />
        {/* <StatCard
          title="Total Questions"
          value={realStats.totalQuestions}
          change={0}
          icon={MessageSquare}
          description="Questions in database"
        /> */}
        <StatCard
          title="Total Videos"
          value={realStats.totalVideos}
          change={0}
          icon={Video}
          description="Videos in library"
        />
        <StatCard
          title="Published Videos"
          value={realStats.publishedVideos}
          change={0}
          icon={Video}
          description="Published video content"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Daily Active Users (Trend)"
          value={trendStats.totalDAU}
          change={trendStats.dauChange}
          icon={Users}
          description="Average daily active users"
          showDecimal={true}
        />
        {/* <StatCard
          title="Questions Asked (Trend)"
          value={trendStats.totalQuestions}
          change={trendStats.questionsChange}
          icon={MessageSquare}
          description="Average daily questions"
          showDecimal={true}
        /> */}
        <StatCard
          title="Videos Watched (Trend)"
          value={trendStats.totalVideos}
          change={trendStats.videosChange}
          icon={Video}
          description="Average daily video views"
          showDecimal={true}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* DAU Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
            <CardDescription>User activity over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={dauChartConfig}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillDau" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-dau)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-dau)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area
                  dataKey="dau"
                  type="monotone"
                  fill="url(#fillDau)"
                  fillOpacity={0.4}
                  stroke="var(--color-dau)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Questions Chart */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Questions Asked</CardTitle>
            <CardDescription>Question volume over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={questionsChartConfig}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="questions" fill="var(--color-questions)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card> */}
      </div>

      {/* Videos Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Videos Watched</CardTitle>
          <CardDescription>Video engagement over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={videosChartConfig} className="h-[300px]">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillVideos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-videos)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-videos)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                dataKey="videos"
                type="monotone"
                fill="url(#fillVideos)"
                fillOpacity={0.4}
                stroke="var(--color-videos)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Combined Chart */}
      <Card>
        <CardHeader>
          <CardTitle>All Metrics Overview</CardTitle>
          <CardDescription>Compare DAU, questions, and videos in one view</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={combinedChartConfig} className="h-[400px]">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillDauCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-dau)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-dau)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillQuestionsCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-questions)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-questions)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillVideosCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-videos)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-videos)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                dataKey="dau"
                type="monotone"
                fill="url(#fillDauCombined)"
                fillOpacity={0.4}
                stroke="var(--color-dau)"
                stackId="a"
              />
              <Area
                dataKey="questions"
                type="monotone"
                fill="url(#fillQuestionsCombined)"
                fillOpacity={0.4}
                stroke="var(--color-questions)"
                stackId="b"
              />
              <Area
                dataKey="videos"
                type="monotone"
                fill="url(#fillVideosCombined)"
                fillOpacity={0.4}
                stroke="var(--color-videos)"
                stackId="c"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
