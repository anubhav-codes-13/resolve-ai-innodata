const BASE = "http://localhost:8000";

// Types
export type TimeWindow = "24h" | "7d" | "30d";
export type Channel = "All" | "Chat" | "Call" | "Email";

export interface KpiValue { value: number; trend: number | null; }
export interface DashboardPayload {
  filters: { time: string; channel: string; start_date: string; end_date: string };
  kpis: {
    total_requests: KpiValue;
    resolution_rate: KpiValue;
    aht: KpiValue;
    csat: KpiValue;
    drop_off: KpiValue;
  };
  charts: {
    trends: { date: string; volume: number; resolution: number; escalation: number }[];
    clusters: { topic: string; vol: number; prev_vol: number; chg: number | null; trend_data: number[] }[];
  };
  ai_insight: string;
  monitoring: {
    trending: { topic: string; vol: number; trend_pct: number; trend_data: number[] }[];
    performing: { topic: string; vol: number; csat: number; trend_data: number[] }[];
    category_metrics: { topic: string; vol: number; resolution: number; repeat_call: number; drop_off: number; trend_data: number[] }[];
  };
  issues_insights: {
    l1_topic: string; l2_topic: string; volume: number; csat: number;
    drop_off: number; aht: number; is_resolved: number; repeat: number; escalation: number;
  }[];
}

export async function fetchDashboard(timeWindow: TimeWindow, channel: Channel): Promise<DashboardPayload> {
  const res = await fetch(
    `${BASE}/api/dashboard?time_window=${timeWindow}&channel=${channel.toLowerCase()}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Helper: format AHT minutes → "Xm Ys" or "Xm"
export function fmtAht(minutes: number): string {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// Helper: format trend number → "+8.2%" or "-3.1%"
export function fmtTrend(trend: number | null): string {
  if (trend === null) return "—";
  return trend >= 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;
}

// Helper: is trend "up" (good direction) — note: for drop_off and aht, lower is better
export function trendUp(key: keyof DashboardPayload["kpis"], trend: number | null): boolean {
  if (trend === null) return true;
  const invertedKeys = ["drop_off", "aht"];
  const isInverted = invertedKeys.includes(key);
  return isInverted ? trend <= 0 : trend >= 0;
}

// Helper: format chart date label based on time window
export function fmtChartLabel(dateStr: string, timeWindow: TimeWindow): string {
  const d = new Date(dateStr);
  if (timeWindow === "24h") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (timeWindow === "7d") {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  // 30d — return "Week N" based on position (caller handles this)
  return dateStr;
}
