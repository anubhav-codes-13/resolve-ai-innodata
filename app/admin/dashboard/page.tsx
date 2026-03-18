"use client";

import { useState, useRef } from "react";
import AdminLayout from "@/components/dashboard/AdminLayout";
import { CLUSTER_DATA, CHANNEL_TRENDS, CHANNEL_STATS, AI_INSIGHTS } from "@/lib/mockData";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
    Activity, Users, Zap, Clock,
    Sparkles, MessageSquare, Send, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type DateRange = "24h" | "7d" | "30d";
type Channel = "All" | "Chat" | "Call" | "Email";
type HoverInfo = {
    x: number;
    containerWidth: number;
    time: string;
    resolution: number;
    volume: number;
    escalation: number;
} | null;

type TrendSet = { requests: string; requestsUp: boolean; resolution: string; resolutionUp: boolean; aht: string; ahtUp: boolean; csat: string; csatUp: boolean; dropOff: string; dropOffUp: boolean };

const STAT_TRENDS: Record<DateRange, Record<Channel, TrendSet>> = {
    "24h": {
        All:   { requests: "+3.1%", requestsUp: true,  resolution: "+1.2%", resolutionUp: true,  aht: "+0.1m", ahtUp: false, csat: "+0.4%", csatUp: true,  dropOff: "+0.8%", dropOffUp: false },
        Chat:  { requests: "+4.2%", requestsUp: true,  resolution: "+2.1%", resolutionUp: true,  aht: "-0.1m", ahtUp: true,  csat: "+0.6%", csatUp: true,  dropOff: "-0.4%", dropOffUp: true  },
        Call:  { requests: "+1.8%", requestsUp: true,  resolution: "-0.9%", resolutionUp: false, aht: "+0.3m", ahtUp: false, csat: "-0.2%", csatUp: false, dropOff: "+1.1%", dropOffUp: false },
        Email: { requests: "+0.9%", requestsUp: true,  resolution: "-1.4%", resolutionUp: false, aht: "+0.5m", ahtUp: false, csat: "-0.3%", csatUp: false, dropOff: "+1.5%", dropOffUp: false },
    },
    "7d": {
        All:   { requests: "+12.5%", requestsUp: true,  resolution: "+4.2%", resolutionUp: true,  aht: "-0.4m", ahtUp: true,  csat: "+2.1%", csatUp: true,  dropOff: "+0.3%", dropOffUp: false },
        Chat:  { requests: "+15.3%", requestsUp: true,  resolution: "+6.1%", resolutionUp: true,  aht: "-0.6m", ahtUp: true,  csat: "+3.2%", csatUp: true,  dropOff: "-1.2%", dropOffUp: true  },
        Call:  { requests: "+8.7%",  requestsUp: true,  resolution: "+1.4%", resolutionUp: true,  aht: "+0.2m", ahtUp: false, csat: "+0.8%", csatUp: true,  dropOff: "+1.9%", dropOffUp: false },
        Email: { requests: "+5.2%",  requestsUp: true,  resolution: "-2.1%", resolutionUp: false, aht: "+0.8m", ahtUp: false, csat: "-1.1%", csatUp: false, dropOff: "+2.4%", dropOffUp: false },
    },
    "30d": {
        All:   { requests: "+22.8%", requestsUp: true,  resolution: "+8.4%", resolutionUp: true,  aht: "-0.9m", ahtUp: true,  csat: "+4.6%", csatUp: true,  dropOff: "-2.1%", dropOffUp: true  },
        Chat:  { requests: "+28.1%", requestsUp: true,  resolution: "+11.2%",resolutionUp: true,  aht: "-1.2m", ahtUp: true,  csat: "+5.8%", csatUp: true,  dropOff: "-3.4%", dropOffUp: true  },
        Call:  { requests: "+14.3%", requestsUp: true,  resolution: "+3.8%", resolutionUp: true,  aht: "-0.3m", ahtUp: true,  csat: "+2.2%", csatUp: true,  dropOff: "+0.7%", dropOffUp: false },
        Email: { requests: "+9.6%",  requestsUp: true,  resolution: "-0.9%", resolutionUp: false, aht: "+1.1m", ahtUp: false, csat: "-0.4%", csatUp: false, dropOff: "+3.8%", dropOffUp: false },
    },
};

const CLUSTER_META: Record<string, { change: string; up: boolean; spark: number[] }> = {
    "Payment Failed": { change: "+19%", up: true, spark: [38, 42, 40, 45, 50, 55, 58, 62] },
    "Order Not Created": { change: "-15%", up: false, spark: [60, 56, 52, 50, 46, 44, 42, 40] },
    "Refund Delay": { change: "+11%", up: true, spark: [30, 31, 33, 32, 35, 36, 38, 40] },
    "Card Declined": { change: "+22%", up: true, spark: [28, 30, 32, 36, 38, 42, 46, 50] },
    "OTP Not Received": { change: "+12%", up: true, spark: [20, 21, 22, 22, 23, 24, 25, 26] },
    "Delivery Tracking": { change: "+8%", up: true, spark: [18, 19, 19, 20, 20, 21, 22, 22] },
    "Checkout Error": { change: "+42%", up: true, spark: [12, 16, 20, 26, 32, 38, 44, 50] },
    "Login Problem": { change: "-4%", up: false, spark: [22, 22, 21, 21, 20, 20, 19, 19] },
    "App Crash": { change: "+31%", up: true, spark: [10, 12, 14, 16, 20, 24, 28, 32] },
    "Coupon Error": { change: "+6%", up: true, spark: [14, 14, 15, 15, 15, 16, 16, 17] },
};

export default function AdminDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>("7d");
    const [channel, setChannel] = useState<Channel>("All");
    const [followUpText, setFollowUpText] = useState("");
    const [clusterPage, setClusterPage] = useState(0);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    function handleChartMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!chartRef.current || !trendData.length) return;
        const rect = chartRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        // Plot area boundaries: left YAxis width=38, margin.left=-10 → plotLeft≈28
        // right YAxis width=30, margin.right=44 → plotRight≈width-74
        const plotLeft = 28;
        const plotRight = rect.width - 74;
        if (mouseX < plotLeft || mouseX > plotRight) { setHoverInfo(null); return; }
        const n = trendData.length;
        const floatIdx = ((mouseX - plotLeft) / (plotRight - plotLeft)) * (n - 1);
        const lo = Math.max(0, Math.floor(floatIdx));
        const hi = Math.min(n - 1, Math.ceil(floatIdx));
        const t = floatIdx - lo;
        const tc = (1 - Math.cos(t * Math.PI)) / 2;
        const a = trendData[lo], b = trendData[hi];
        setHoverInfo({
            x: mouseX,
            containerWidth: rect.width,
            time: tc < 0.5 ? String(a.time) : String(b.time),
            resolution: Number(a.resolution) + (Number(b.resolution) - Number(a.resolution)) * tc,
            volume: Number(a.volume) + (Number(b.volume) - Number(a.volume)) * tc,
            escalation: Number(a.escalation) + (Number(b.escalation) - Number(a.escalation)) * tc,
        });
    }

    const trendData = CHANNEL_TRENDS[dateRange][channel];
    const stats = CHANNEL_STATS[channel];
    const clusters = CLUSTER_DATA[dateRange][channel];
    // reset page when filter changes
    const safeClusterPage = Math.min(clusterPage, Math.max(0, Math.ceil(clusters.length / 5) - 1));
    const insight = AI_INSIGHTS[dateRange][channel];
    const trends = STAT_TRENDS[dateRange][channel];

    return (
        <AdminLayout>
            <div className="space-y-3 max-w-7xl mx-auto">

                {/* Filter Row */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="flex flex-wrap items-center justify-between gap-2"
                >
                    <div className="flex gap-1.5">
                        {(["24h", "7d", "30d"] as DateRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setDateRange(r)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                                    dateRange === r
                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        : "bg-zinc-900 text-zinc-500 border-white/5 hover:text-white hover:border-white/10"
                                )}
                            >
                                {r === "24h" ? "24 Hours" : r === "7d" ? "7 Days" : "30 Days"}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1.5">
                        {(["All", "Chat", "Call", "Email"] as Channel[]).map((c) => (
                            <button
                                key={c}
                                onClick={() => setChannel(c)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                                    channel === c
                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        : "bg-zinc-900 text-zinc-500 border-white/5 hover:text-white hover:border-white/10"
                                )}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* AI Generated Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-3 rounded-2xl bg-zinc-950 border border-blue-500/10 flex gap-3 items-start"
                >
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/10 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-0.5">AI Insight</p>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium line-clamp-2">{insight}</p>
                    </div>
                </motion.div>

                {/* Metric Cards */}
                <div className="grid grid-cols-5 gap-3">
                    <StatCard delay={0.1} label="Total Requests" value={stats.totalRequests} trend={trends.requests} up={trends.requestsUp} icon={<Users className="w-3.5 h-3.5" />} />
                    <StatCard delay={0.13} label="Resolution Rate" value={stats.resolutionRate} trend={trends.resolution} up={trends.resolutionUp} icon={<Activity className="w-3.5 h-3.5" />} />
                    <StatCard delay={0.16} label="Avg. Handling Time" value={stats.avgHealingTime} trend={trends.aht} up={trends.ahtUp} icon={<Clock className="w-3.5 h-3.5" />} />
                    <StatCard delay={0.19} label="CSAT Score" value={stats.csatScore} trend={trends.csat} up={trends.csatUp} icon={<Zap className="w-3.5 h-3.5" />} />
                    <StatCard delay={0.22} label="Drop-Off Rate" value={stats.dropOffRate} trend={trends.dropOff} up={trends.dropOffUp} icon={<Activity className="w-3.5 h-3.5" />} />
                </div>

                {/* Customer Call Trends + Issue Clusters */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[340px]">

                    {/* Trend Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="lg:col-span-2 p-4 rounded-[24px] bg-zinc-950 border border-white/5 flex flex-col gap-3"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                            <div>
                                <h3 className="text-sm font-bold text-white">Customer Call Trends</h3>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                    Showing: <span className="text-zinc-400 font-semibold">{channel}</span>
                                </p>
                            </div>
                            <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5 text-blue-500"><span className="w-3 h-0.5 rounded bg-blue-500 inline-block" />Resolution</span>
                                <span className="flex items-center gap-1.5 text-emerald-500"><span className="w-3 h-0.5 rounded bg-emerald-500 inline-block" />Volume</span>
                                <span className="flex items-center gap-1.5 text-amber-500"><span className="w-3 h-0.5 rounded bg-amber-500 inline-block" />Escalation</span>
                            </div>
                        </div>
                        <div
                            ref={chartRef}
                            className="flex-1 min-h-0 w-full overflow-hidden relative"
                            onMouseMove={handleChartMouseMove}
                            onMouseLeave={() => setHoverInfo(null)}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 4, right: 44, bottom: 0, left: -10 }}>
                                    <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                                    <XAxis dataKey="time" tick={{ fill: "#52525b", fontSize: 9 }} height={18} tickLine={false} />
                                    <YAxis yAxisId="vol" orientation="left" tick={{ fill: "#52525b", fontSize: 9 }} width={38} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                    <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 9 }} width={30} tickFormatter={(v) => `${v}%`} />
                                    <Line yAxisId="pct" type="monotone" dataKey="resolution" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    <Line yAxisId="vol" type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="5 4" />
                                    <Line yAxisId="pct" type="monotone" dataKey="escalation" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>

                            {/* Continuous hover overlay */}
                            {hoverInfo && (
                                <div className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }}>
                                    {/* Vertical cursor line */}
                                    <div
                                        className="absolute top-[4px] bottom-[18px] w-px bg-white/20"
                                        style={{ left: hoverInfo.x }}
                                    />
                                    {/* Floating tooltip card */}
                                    <div
                                        className="absolute top-2 bg-[rgba(9,9,11,0.95)] border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl backdrop-blur-xl min-w-[130px]"
                                        style={{
                                            left: hoverInfo.x > hoverInfo.containerWidth / 2
                                                ? hoverInfo.x - 146
                                                : hoverInfo.x + 12,
                                        }}
                                    >
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{hoverInfo.time}</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                                <span className="text-[11px] text-zinc-400 flex-1">Resolution</span>
                                                <span className="text-[11px] text-white font-bold tabular-nums">{hoverInfo.resolution.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                <span className="text-[11px] text-zinc-400 flex-1">Volume</span>
                                                <span className="text-[11px] text-white font-bold tabular-nums">{Math.round(hoverInfo.volume).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                                <span className="text-[11px] text-zinc-400 flex-1">Escalation</span>
                                                <span className="text-[11px] text-white font-bold tabular-nums">{hoverInfo.escalation.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Issue Clusters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="p-4 rounded-[24px] bg-zinc-950 border border-white/5 flex flex-col h-full overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-white">Issue Clusters</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-zinc-600 font-bold tabular-nums">{safeClusterPage + 1} / {Math.ceil(clusters.length / 5)}</span>
                                <button
                                    onClick={() => setClusterPage(p => Math.max(0, p - 1))}
                                    disabled={safeClusterPage === 0}
                                    className="p-1 rounded-lg border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => setClusterPage(p => Math.min(Math.ceil(clusters.length / 5) - 1, p + 1))}
                                    disabled={safeClusterPage >= Math.ceil(clusters.length / 5) - 1}
                                    className="p-1 rounded-lg border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        {/* Column Headers */}
                        <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5 mb-0.5">
                            <span className="text-[9px] uppercase tracking-[0.15em] font-black text-zinc-600 flex-1">Topic</span>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[9px] uppercase tracking-[0.15em] font-black text-zinc-600 w-12 text-right">Vol</span>
                                <span className="text-[9px] uppercase tracking-[0.15em] font-black text-zinc-600 w-10 text-right">Chg</span>
                                <span className="text-[9px] uppercase tracking-[0.15em] font-black text-zinc-600 w-16 text-center">Trend</span>
                            </div>
                        </div>
                        <div className="flex-1 divide-y divide-white/[0.03]">
                            {clusters.slice(safeClusterPage * 5, safeClusterPage * 5 + 5).map((issue) => {
                                const meta = CLUSTER_META[issue.name] ?? { change: "+0%", up: true, spark: [10, 10, 10, 10, 10, 10, 10, 10] };
                                const sparkData = meta.spark.map((v) => ({ v }));
                                return (
                                    <div key={issue.name} className="flex items-center justify-between px-2 py-2.5 hover:bg-white/[0.03] transition-all group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate">{issue.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <p className="text-sm font-black text-emerald-400 tabular-nums w-12 text-right">{issue.count.toLocaleString()}</p>
                                            <span className={`text-xs font-bold tabular-nums w-10 text-right ${meta.up ? "text-emerald-400" : "text-zinc-500"}`}>
                                                {meta.change}
                                            </span>
                                            <div className="w-16 h-8 shrink-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                                                        <Line type="monotone" dataKey="v" stroke={meta.up ? "#34d399" : "#71717a"} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Follow-up Input */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-1.5 rounded-2xl bg-zinc-950 border border-white/5 flex items-center gap-2 hover:border-white/10 transition-all focus-within:border-blue-500/30"
                >
                    <div className="p-2 rounded-xl bg-zinc-900 border border-white/5 ml-2 shrink-0">
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <input
                        type="text"
                        value={followUpText}
                        onChange={(e) => setFollowUpText(e.target.value)}
                        placeholder="Ask a follow-up question about your support data..."
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none py-2"
                    />
                    <button
                        disabled={!followUpText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed mr-1.5 shrink-0"
                    >
                        <Send className="w-3 h-3" />
                        Ask
                    </button>
                </motion.div>

            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value, icon, trend, up, delay }: { label: string; value: string; trend?: string; up?: boolean; icon: React.ReactNode; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-4 rounded-[20px] bg-zinc-950 border border-white/5 space-y-2.5 hover:border-white/10 transition-all group"
        >
            <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 group-hover:text-blue-500 transition-all duration-300 w-fit">
                    {icon}
                </div>
                {trend && (
                    <span className={cn(
                        "flex items-center gap-1 text-[10px] font-bold tabular-nums",
                        up ? "text-emerald-400" : "text-red-400"
                    )}>
                        <span>{up ? "↗" : "↘"}</span>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{value}</p>
            </div>
        </motion.div>
    );
}
