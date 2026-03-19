"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/dashboard/AdminLayout";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, CheckCircle2, Activity, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { fetchDashboard, DashboardPayload } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type DateRange = "24h" | "7d" | "30d";
type Channel   = "All" | "Chat" | "Call" | "Email";

const DATE_RANGES: DateRange[] = ["24h", "7d", "30d"];
const CHANNELS:   Channel[]   = ["All", "Chat", "Call", "Email"];
const DATE_LABELS: Record<DateRange, string> = { "24h": "24 Hours", "7d": "7 Days", "30d": "30 Days" };

type MetricKey = "Resolution" | "Repeat Call" | "Drop Off";
const METRICS: MetricKey[] = ["Resolution", "Repeat Call", "Drop Off"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function MonitoringPage() {
    const [dateRange, setDateRange]           = useState<DateRange>("7d");
    const [channel, setChannel]               = useState<Channel>("All");
    const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>("Resolution");
    const [metricOpen, setMetricOpen]         = useState(false);
    const [trendPage,   setTrendPage]         = useState(0);
    const [performPage, setPerformPage]       = useState(0);
    const [metricPage,  setMetricPage]        = useState(0);
    const [data, setData]                     = useState<DashboardPayload | null>(null);
    const [loading, setLoading]               = useState(true);
    const [lastUpdated, setLastUpdated]       = useState<Date | null>(null);

    useEffect(() => {
        setLoading(true);
        fetchDashboard(dateRange, channel)
            .then((d) => { setData(d); setLastUpdated(new Date()); })
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [dateRange, channel]);

    const trendingData = (data?.monitoring.trending ?? []).map((t) => ({
        name: t.topic,
        change: "+" + t.trend_pct.toFixed(0) + "%",
        volume: t.vol,
        spark: t.trend_data,
    }));

    const performingData = (data?.monitoring.performing ?? []).map((p) => ({
        name: p.topic,
        resolutionRate: p.csat.toFixed(1) + "%",
        avgTime: "—",
        csat: p.csat.toFixed(1) + "%",
    }));

    const categoryMetrics = data?.monitoring.category_metrics ?? [];

    const metricTopics = categoryMetrics.map((t) => {
        let value = "—";
        if (selectedMetric === "Resolution") {
            value = t.resolution.toFixed(1) + "%";
        } else if (selectedMetric === "Repeat Call") {
            value = t.repeat_call.toFixed(1) + "%";
        } else if (selectedMetric === "Drop Off") {
            value = t.drop_off.toFixed(1) + "%";
        }
        return {
            name: t.topic,
            volume: t.vol,
            value,
            spark: t.trend_data,
        };
    });

    const filterKey = `${dateRange}-${channel}`;

    return (
        <AdminLayout>
            <div className={cn("space-y-6 pb-10", loading && "opacity-50 pointer-events-none")}>
                {/* Filter Row — date range left, channels right */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="flex flex-wrap items-center justify-between gap-2"
                >
                    <div className="flex gap-1.5">
                        {DATE_RANGES.map(d => (
                            <button
                                key={d}
                                onClick={() => { setDateRange(d); setTrendPage(0); setPerformPage(0); setMetricPage(0); }}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                                    dateRange === d
                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        : "bg-zinc-900 text-zinc-500 border-white/5 hover:text-white hover:border-white/10"
                                )}
                            >
                                {DATE_LABELS[d]}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {lastUpdated && (
                            <span className="text-[10px] text-zinc-600 font-semibold tabular-nums mr-1">
                                Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                        )}
                        {CHANNELS.map(c => (
                            <button
                                key={c}
                                onClick={() => { setChannel(c); setTrendPage(0); setPerformPage(0); setMetricPage(0); }}
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

                {/* Row 1: Trending | Performing | Metric Topics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">

                    {/* Top Trending Topics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="p-6 md:p-8 rounded-[32px] bg-zinc-950 border border-white/5 flex flex-col gap-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/10">
                                    <TrendingUp className="w-4 h-4 text-amber-500" />
                                </div>
                                <h3 className="text-sm font-bold text-white">Top Trending Topics</h3>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-zinc-600 font-bold tabular-nums">{trendPage + 1} / {Math.max(1, Math.ceil(trendingData.length / 5))}</span>
                                <button onClick={() => setTrendPage(p => Math.max(0, p - 1))} disabled={trendPage === 0} className="p-1 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronLeft className="w-3 h-3" />
                                </button>
                                <button onClick={() => setTrendPage(p => Math.min(Math.ceil(trendingData.length / 5) - 1, p + 1))} disabled={trendPage >= Math.ceil(trendingData.length / 5) - 1} className="p-1 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            {trendingData.slice(trendPage * 5, trendPage * 5 + 5).map((t, i) => {
                                const sparkData = t.spark.map((v) => ({ v }));
                                return (
                                    <motion.div
                                        key={`${filterKey}-${trendPage}-${t.name}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 + i * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{t.name}</p>
                                            <p className="text-[10px] text-zinc-600 mt-0.5 tabular-nums">{t.volume.toLocaleString()} vol</p>
                                        </div>
                                        <div className="w-14 h-8 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                                                    <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/10 px-2 py-1 rounded-lg shrink-0">
                                            {t.change}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Top Performing Topics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="p-6 md:p-8 rounded-[32px] bg-zinc-950 border border-white/5 flex flex-col gap-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <h3 className="text-sm font-bold text-white">Top Performing Topics</h3>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-zinc-600 font-bold tabular-nums">{performPage + 1} / {Math.max(1, Math.ceil(performingData.length / 4))}</span>
                                <button onClick={() => setPerformPage(p => Math.max(0, p - 1))} disabled={performPage === 0} className="p-1 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronLeft className="w-3 h-3" />
                                </button>
                                <button onClick={() => setPerformPage(p => Math.min(Math.ceil(performingData.length / 4) - 1, p + 1))} disabled={performPage >= Math.ceil(performingData.length / 4) - 1} className="p-1 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            {performingData.slice(performPage * 4, performPage * 4 + 4).map((t, i) => (
                                <motion.div
                                    key={`${filterKey}-${performPage}-${t.name}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 + i * 0.05 }}
                                    className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2"
                                >
                                    <p className="text-xs font-bold text-white">{t.name}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-lg">
                                            {t.resolutionRate} resolved
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-lg">
                                            {t.avgTime}
                                        </span>
                                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/10 px-2 py-0.5 rounded-lg">
                                            {t.csat} CSAT
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Top Topics by selected Category */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="p-6 md:p-8 rounded-[32px] bg-zinc-950 border border-white/5 flex flex-col gap-4"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/10 shrink-0">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-white leading-tight">Top Topics by Category</h3>
                                    <p className="text-[10px] text-zinc-600 mt-0.5">Select metric to explore</p>
                                </div>
                            </div>
                            {selectedMetric && (
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span className="text-[10px] text-zinc-600 font-bold tabular-nums whitespace-nowrap">{metricPage + 1} / {Math.max(1, Math.ceil(metricTopics.length / 5))}</span>
                                    <button onClick={() => setMetricPage(p => Math.max(0, p - 1))} disabled={metricPage === 0} className="p-1 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        <ChevronLeft className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setMetricPage(p => Math.min(Math.ceil(metricTopics.length / 5) - 1, p + 1))} disabled={metricPage >= Math.ceil(metricTopics.length / 5) - 1} className="p-1 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Metric dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setMetricOpen(o => !o)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left",
                                    selectedMetric ? "border-blue-500/30 bg-blue-500/5" : "border-white/5 hover:border-white/10"
                                )}
                            >
                                <span className={cn("text-xs font-bold truncate", selectedMetric ? "text-blue-400" : "text-zinc-400")}>
                                    {selectedMetric ?? "Select Metric"}
                                </span>
                                <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 shrink-0 ml-2 transition-transform duration-200", metricOpen && "rotate-180")} />
                            </button>
                            {metricOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
                                    {METRICS.map((m, i) => (
                                        <button
                                            key={m}
                                            onClick={() => { setSelectedMetric(m); setMetricOpen(false); setMetricPage(0); }}
                                            className={cn(
                                                "w-full px-3 py-2.5 hover:bg-white/5 transition-colors text-left text-xs font-bold",
                                                i > 0 && "border-t border-white/5",
                                                selectedMetric === m ? "text-blue-400 bg-blue-500/5" : "text-zinc-400"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Metric table — shown only when a metric is selected */}
                        <div className="flex-1 flex flex-col">
                        {selectedMetric && (() => {
                            const metricColor = selectedMetric === "Resolution" ? "text-emerald-400" : selectedMetric === "Repeat Call" ? "text-amber-400" : "text-red-400";
                            const sparkColor  = selectedMetric === "Resolution" ? "#10b981" : selectedMetric === "Repeat Call" ? "#f59e0b" : "#ef4444";
                            const colLabel    = selectedMetric === "Resolution" ? "Res" : selectedMetric === "Repeat Call" ? "Rep" : "Drop";

                            const rows = metricTopics.slice(metricPage * 5, metricPage * 5 + 5);

                            return (
                                <div>
                                    <div className="flex items-center px-2 pb-2 border-b border-white/5">
                                        <span className="flex-1 min-w-0 text-[9px] uppercase tracking-[0.15em] font-black text-zinc-700">Topic</span>
                                        <span className="w-10 text-right text-[9px] uppercase tracking-[0.12em] font-black text-zinc-700 shrink-0">Vol</span>
                                        <span className="w-10 text-center text-[9px] uppercase tracking-[0.12em] font-black text-zinc-700 shrink-0">{colLabel}</span>
                                        <span className="w-12 text-center text-[9px] uppercase tracking-[0.12em] font-black text-zinc-700 shrink-0">Trend</span>
                                    </div>
                                    {rows.map(row => {
                                        const sparkData = row.spark.map(v => ({ v }));
                                        return (
                                            <div key={row.name} className="flex items-center px-2 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                                                <span className="flex-1 min-w-0 text-xs font-bold truncate text-zinc-300 group-hover:text-white transition-colors pr-1">{row.name}</span>
                                                <span className="w-10 text-right text-xs font-black tabular-nums text-emerald-400 shrink-0">
                                                    {row.volume >= 1000 ? `${(row.volume / 1000).toFixed(1)}k` : row.volume}
                                                </span>
                                                <span className={cn("w-10 text-center text-xs font-black tabular-nums shrink-0", metricColor)}>{row.value}</span>
                                                <div className="w-12 h-8 shrink-0">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                                                            <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        </div>
                    </motion.div>
                </div>

            </div>
        </AdminLayout>
    );
}
