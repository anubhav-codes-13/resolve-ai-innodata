"use client";

import { useState } from "react";
import AdminLayout from "@/components/dashboard/AdminLayout";
import { CLUSTER_DATA, CHANNEL_TRENDS, CHANNEL_STATS, AI_INSIGHTS } from "@/lib/mockData";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    Activity, Users, Zap, Clock,
    Sparkles, MessageSquare, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type DateRange = "24h" | "7d" | "30d";
type Channel = "All" | "Chat" | "Call" | "Email";

const CLUSTER_META: Record<string, { change: string; up: boolean; spark: number[] }> = {
    "Payment Failed":    { change: "+19%", up: true,  spark: [38, 42, 40, 45, 50, 55, 58, 62] },
    "Order Not Created": { change: "-15%", up: false, spark: [60, 56, 52, 50, 46, 44, 42, 40] },
    "Refund Delay":      { change: "+11%", up: true,  spark: [30, 31, 33, 32, 35, 36, 38, 40] },
    "Card Declined":     { change: "+22%", up: true,  spark: [28, 30, 32, 36, 38, 42, 46, 50] },
    "OTP Not Received":  { change: "+12%", up: true,  spark: [20, 21, 22, 22, 23, 24, 25, 26] },
    "Delivery Tracking": { change: "+8%",  up: true,  spark: [18, 19, 19, 20, 20, 21, 22, 22] },
    "Checkout Error":    { change: "+42%", up: true,  spark: [12, 16, 20, 26, 32, 38, 44, 50] },
    "Login Problem":     { change: "-4%",  up: false, spark: [22, 22, 21, 21, 20, 20, 19, 19] },
    "App Crash":         { change: "+31%", up: true,  spark: [10, 12, 14, 16, 20, 24, 28, 32] },
    "Coupon Error":      { change: "+6%",  up: true,  spark: [14, 14, 15, 15, 15, 16, 16, 17] },
};

export default function AdminDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>("7d");
    const [channel, setChannel] = useState<Channel>("All");
    const [followUpText, setFollowUpText] = useState("");

    const trendData = CHANNEL_TRENDS[dateRange][channel];
    const stats = CHANNEL_STATS[channel];
    const clusters = CLUSTER_DATA[dateRange][channel];
    const insight = AI_INSIGHTS[dateRange][channel];

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
                    <StatCard delay={0.1}  label="Total Requests"   value={stats.totalRequests}  trend="+12.5%" up         icon={<Users className="w-3.5 h-3.5" />} />
                    <StatCard delay={0.13} label="Resolution Rate"  value={stats.resolutionRate} trend="+4.2%"  up         icon={<Activity className="w-3.5 h-3.5" />} />
                    <StatCard delay={0.16} label="Avg. Heal Time"   value={stats.avgHealingTime} trend="-0.4m"  up={false} icon={<Clock className="w-3.5 h-3.5" />} />
                    <StatCard delay={0.19} label="CSAT Score"       value={stats.csatScore}      trend="+2.1%"  up         icon={<Zap className="w-3.5 h-3.5" />} />
                    <StatCard delay={0.22} label="Drop-Off Rate"    value={stats.dropOffRate}    trend="+0.3%"  up={false} icon={<Activity className="w-3.5 h-3.5" />} />
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
                        <div className="flex-1 min-h-0 w-full overflow-hidden">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 4, right: 44, bottom: 0, left: -10 }}>
                                    <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                                    <XAxis dataKey="time" tick={{ fill: "#52525b", fontSize: 9 }} height={18} tickLine={false} />
                                    <YAxis yAxisId="vol" orientation="left" tick={{ fill: "#52525b", fontSize: 9 }} width={38} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                    <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fill: "#52525b", fontSize: 9 }} width={30} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "11px", color: "#fff" }}
                                        formatter={(value, name) => {
                                            if (value == null) return ["—", name as string];
                                            return name === "Volume"
                                                ? [Number(value).toLocaleString(), name as string]
                                                : [`${value}%`, name as string];
                                        }}
                                    />
                                    <Line yAxisId="pct" type="monotone" dataKey="resolution" stroke="#3b82f6" strokeWidth={2} dot={false} name="Resolution %" />
                                    <Line yAxisId="vol" type="monotone" dataKey="volume"     stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="5 4" name="Volume" />
                                    <Line yAxisId="pct" type="monotone" dataKey="escalation" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Escalation %" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Issue Clusters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="p-4 rounded-[24px] bg-zinc-950 border border-white/5 flex flex-col h-full overflow-hidden"
                    >
                        <h3 className="text-sm font-bold text-white mb-3">Issue Clusters</h3>
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
                            {clusters.map((issue) => {
                                const meta = CLUSTER_META[issue.name] ?? { change: "+0%", up: true, spark: [10, 10, 10, 10, 10, 10, 10, 10] };
                                const sparkData = meta.spark.map((v) => ({ v }));
                                return (
                                    <div key={issue.name} className="flex items-center justify-between px-2 py-2.5 hover:bg-white/[0.03] transition-all group">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate">{issue.name}</p>
                                            <p className="text-[10px] text-zinc-600 font-medium mt-0.5">Healed in {issue.healingTime}</p>
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

function StatCard({ label, value, icon, delay }: { label: string; value: string; trend?: string; up?: boolean; icon: React.ReactNode; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-4 rounded-[20px] bg-zinc-950 border border-white/5 space-y-2.5 hover:border-white/10 transition-all group"
        >
            <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 group-hover:text-blue-500 transition-all duration-300 w-fit">
                {icon}
            </div>
            <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{value}</p>
            </div>
        </motion.div>
    );
}
