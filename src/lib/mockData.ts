// Mock data service for admin dashboard
export interface DailyStats {
  date: string;
  dau: number;
  questions: number;
  videos: number;
}

export interface DashboardStats {
  totalDAU: number;
  totalQuestions: number;
  totalVideos: number;
  dauChange: number;
  questionsChange: number;
  videosChange: number;
  dailyStats: DailyStats[];
}

// Generate mock data for the last 30 days
export function generateMockData(): DashboardStats {
  const dailyStats: DailyStats[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic-looking data with some variation
    const baseDAU = 500 + Math.random() * 200;
    const baseQuestions = baseDAU * (0.5 + Math.random() * 0.5);
    const baseVideos = baseDAU * (0.3 + Math.random() * 0.4);
    
    dailyStats.push({
      date: date.toISOString().split('T')[0],
      dau: Math.round(baseDAU),
      questions: Math.round(baseQuestions),
      videos: Math.round(baseVideos),
    });
  }
  
  const totalDAU = dailyStats.reduce((sum, day) => sum + day.dau, 0);
  const totalQuestions = dailyStats.reduce((sum, day) => sum + day.questions, 0);
  const totalVideos = dailyStats.reduce((sum, day) => sum + day.videos, 0);
  
  // Calculate changes (comparing last 7 days to previous 7 days)
  const last7Days = dailyStats.slice(-7);
  const previous7Days = dailyStats.slice(-14, -7);
  
  const last7DAU = last7Days.reduce((sum, day) => sum + day.dau, 0);
  const prev7DAU = previous7Days.reduce((sum, day) => sum + day.dau, 0);
  const dauChange = prev7DAU > 0 ? ((last7DAU - prev7DAU) / prev7DAU) * 100 : 0;
  
  const last7Questions = last7Days.reduce((sum, day) => sum + day.questions, 0);
  const prev7Questions = previous7Days.reduce((sum, day) => sum + day.questions, 0);
  const questionsChange = prev7Questions > 0 ? ((last7Questions - prev7Questions) / prev7Questions) * 100 : 0;
  
  const last7Videos = last7Days.reduce((sum, day) => sum + day.videos, 0);
  const prev7Videos = previous7Days.reduce((sum, day) => sum + day.videos, 0);
  const videosChange = prev7Videos > 0 ? ((last7Videos - prev7Videos) / prev7Videos) * 100 : 0;
  
  return {
    totalDAU: Math.round(totalDAU / 30), // Average daily
    totalQuestions: Math.round(totalQuestions / 30), // Average daily
    totalVideos: Math.round(totalVideos / 30), // Average daily
    dauChange: Math.round(dauChange * 10) / 10,
    questionsChange: Math.round(questionsChange * 10) / 10,
    videosChange: Math.round(videosChange * 10) / 10,
    dailyStats,
  };
}
