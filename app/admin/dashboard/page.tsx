"use client";

import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/dashboard/AdminLayout";
import { fetchDashboard, fmtAht, fmtTrend, trendUp, fmtChartLabel, DashboardPayload } from "@/lib/api";
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

export default function AdminDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>("7d");
    const [channel, setChannel] = useState<Channel>("All");
    const [followUpText, setFollowUpText] = useState("");
    const [clusterPage, setClusterPage] = useState(0);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
    const [data, setData] = useState<DashboardPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoading(true);
        fetchDashboard(dateRange, channel)
            .then((d) => { setData(d); setLastUpdated(new Date()); })
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [dateRange, channel]);

    const trendData = data
        ? data.charts.trends.map((d) => ({
            time: fmtChartLabel(d.date, dateRange),
            resolution: d.resolution,
            volume: d.volume,
            escalation: d.escalation,
        }))
        : [];

    const clusters = data
        ? data.charts.clusters.map((c) => ({
            name: c.topic,
            count: c.vol,
            change: c.chg !== null ? (c.chg >= 0 ? "+" : "") + c.chg.toFixed(0) + "%" : "—",
            change_up: c.chg !== null ? c.chg >= 0 : true,
            spark: c.trend_data,
        }))
        : [];

    const insight = data?.ai_insight ?? "";

    const kpis = data?.kpis;
    const statCards = [
        {
            delay: 0.1,
            label: "Total Requests",
            value: kpis ? kpis.total_requests.value.toLocaleString() : "—",
            trend: kpis ? fmtTrend(kpis.total_requests.trend) : undefined,
            up: kpis ? trendUp("total_requests", kpis.total_requests.trend) : true,
            icon: <Users className="w-3.5 h-3.5" />,
        },
        {
            delay: 0.13,
            label: "Resolution Rate",
            value: kpis ? kpis.resolution_rate.value.toFixed(1) + "%" : "—",
            trend: kpis ? fmtTrend(kpis.resolution_rate.trend) : undefined,
            up: kpis ? trendUp("resolution_rate", kpis.resolution_rate.trend) : true,
            icon: <Activity className="w-3.5 h-3.5" />,
        },
        {
            delay: 0.16,
            label: "Avg. Handling Time",
            value: kpis ? fmtAht(kpis.aht.value) : "—",
            trend: kpis ? fmtTrend(kpis.aht.trend) : undefined,
            up: kpis ? trendUp("aht", kpis.aht.trend) : true,
            icon: <Clock className="w-3.5 h-3.5" />,
        },
        {
            delay: 0.19,
            label: "CSAT Score",
            value: kpis ? kpis.csat.value.toFixed(1) + "%" : "—",
            trend: kpis ? fmtTrend(kpis.csat.trend) : undefined,
            up: kpis ? trendUp("csat", kpis.csat.trend) : true,
            icon: <Zap className="w-3.5 h-3.5" />,
        },
        {
            delay: 0.22,
            label: "Drop-Off Rate",
            value: kpis ? kpis.drop_off.value.toFixed(1) + "%" : "—",
            trend: kpis ? fmtTrend(kpis.drop_off.trend) : undefined,
            up: kpis ? trendUp("drop_off", kpis.drop_off.trend) : true,
            icon: <Activity className="w-3.5 h-3.5" />,
        },
    ];

    const safeClusterPage = Math.min(clusterPage, Math.max(0, Math.ceil(clusters.length / 5) - 1));

    function handleChartMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!chartRef.current || !trendData.length) return;
        const rect = chartRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
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

    return (
        <AdminLayout>
            <div className={cn("space-y-3 max-w-7xl mx-auto", loading && "opacity-50 pointer-events-none")}>

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
                                onClick={() => { setDateRange(r); setClusterPage(0); }}
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
                    <div className="flex items-center gap-2">
                        {lastUpdated && (
                            <span className="text-[10px] text-zinc-600 font-semibold tabular-nums mr-1">
                                Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                        )}
                        {(["All", "Chat", "Call", "Email"] as Channel[]).map((c) => (
                            <button
                                key={c}
                                onClick={() => { setChannel(c); setClusterPage(0); }}
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
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium line-clamp-2">{insight || "Loading insight..."}</p>
                    </div>
                </motion.div>

                {/* Metric Cards */}
                <div className="grid grid-cols-5 gap-3">
                    {statCards.map((card) => (
                        <StatCard
                            key={card.label}
                            delay={card.delay}
                            label={card.label}
                            value={card.value}
                            trend={card.trend}
                            up={card.up}
                            icon={card.icon}
                        />
                    ))}
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
                                <span className="text-[10px] text-zinc-600 font-bold tabular-nums">{safeClusterPage + 1} / {Math.max(1, Math.ceil(clusters.length / 5))}</span>
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
                                const sparkData = issue.spark.map((v) => ({ v }));
                                return (
                                    <div key={issue.name} className="flex items-center justify-between px-2 py-2.5 hover:bg-white/[0.03] transition-all group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate">{issue.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <p className="text-sm font-black text-emerald-400 tabular-nums w-12 text-right">{issue.count.toLocaleString()}</p>
                                            <span className={`text-xs font-bold tabular-nums w-10 text-right ${issue.change_up ? "text-emerald-400" : "text-zinc-500"}`}>
                                                {issue.change}
                                            </span>
                                            <div className="w-16 h-8 shrink-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                                                        <Line type="monotone" dataKey="v" stroke={issue.change_up ? "#34d399" : "#71717a"} strokeWidth={1.5} dot={false} isAnimationActive={false} />
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
                    className="p-1.5 rounded-2xl bg-zinc-900 border border-white/10 flex items-center gap-2 hover:border-white/20 transition-all focus-within:border-blue-500/40 shadow-lg"
                >
                    <div className="p-2 rounded-xl bg-zinc-800 border border-white/10 ml-2 shrink-0">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <input
                        type="text"
                        value={followUpText}
                        onChange={(e) => setFollowUpText(e.target.value)}
                        placeholder="Ask a follow-up question about your support data..."
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-400 focus:outline-none py-2"
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
