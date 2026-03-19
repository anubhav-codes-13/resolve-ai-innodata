"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/dashboard/AdminLayout";
import { fetchDashboard, fmtAht, DashboardPayload } from "@/lib/api";
import { OctagonAlert, Search, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const DATE_RANGES = ["24h", "7d", "30d"] as const;
const DATE_LABELS: Record<string, string> = { "24h": "24 Hours", "7d": "7 Days", "30d": "30 Days" };
const CHANNELS = ["All", "Chat", "Call", "Email"];

export default function IssueInsights() {
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [dateRange, setDateRange] = useState<"24h" | "7d" | "30d">("7d");
    const [channel, setChannel] = useState("All");
    const [page, setPage] = useState(0);
    const [data, setData] = useState<DashboardPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const PAGE_SIZE = 9;

    useEffect(() => {
        setLoading(true);
        fetchDashboard(dateRange, channel as "All" | "Chat" | "Call" | "Email")
            .then((d) => { setData(d); setLastUpdated(new Date()); })
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [dateRange, channel]);

    const rawIssues = data?.issues_insights ?? [];

    const l1Categories = ["All", ...Array.from(new Set(rawIssues.map((i) => i.l1_topic)))];

    const allIssues = rawIssues
        .filter((i) => {
            const matchSearch =
                i.l1_topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.l2_topic.toLowerCase().includes(searchQuery.toLowerCase());
            const matchCat = category === "All" || i.l1_topic === category;
            return matchSearch && matchCat;
        })
        .map((i, idx) => ({
            rank: idx + 1,
            name: i.l2_topic,
            category: i.l1_topic,
            volume: i.volume,
            csat: i.csat.toFixed(1) + "%",
            dropOff: i.drop_off.toFixed(1) + "%",
            aht: fmtAht(i.aht),
            isResolved: i.is_resolved.toFixed(1) + "%",
            repeat: i.repeat.toFixed(1) + "%",
            escalation: i.escalation.toFixed(1) + "%",
        }));

    const totalPages = Math.ceil(allIssues.length / PAGE_SIZE);
    const safePage = Math.min(page, Math.max(0, totalPages - 1));
    const filteredIssues = allIssues.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

    return (
        <AdminLayout>
            <div className={cn("flex-1 min-h-0 flex flex-col gap-4 max-w-7xl mx-auto w-full", loading && "opacity-50 pointer-events-none")}>

                {/* Row 1: Date filters | timestamp + channel filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 pt-1">
                    <div className="flex gap-1.5">
                        {DATE_RANGES.map((d) => (
                            <button key={d} onClick={() => { setDateRange(d); setPage(0); }}
                                className={cn("px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                                    dateRange === d ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-zinc-900 text-zinc-500 border-white/5 hover:text-white hover:border-white/10"
                                )}>
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
                        {CHANNELS.map((c) => (
                            <button key={c} onClick={() => { setChannel(c); setPage(0); }}
                                className={cn("px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                                    channel === c ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-zinc-900 text-zinc-500 border-white/5 hover:text-white hover:border-white/10"
                                )}>
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 2: subtitle | category + search */}
                <div className="flex items-center justify-between gap-3 shrink-0">
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Top L1 topics with drop-off, escalation, and sentiment metrics.</p>
                        <div className="flex items-center gap-2 mt-3">
                            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }}
                                className="bg-zinc-900 border border-white/5 text-xs font-bold text-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 transition-all cursor-pointer appearance-none pr-8"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                            >
                                {l1Categories.map((cat) => (
                                    <option key={cat} value={cat} className="bg-zinc-900 text-zinc-300">{cat}</option>
                                ))}
                            </select>
                            <div className="relative w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                <input type="text" value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                                    placeholder="Search topics..."
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder:text-zinc-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Issue Table — fills remaining height */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="border border-white/5 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl flex-1 min-h-0"
                >
                    <div className="overflow-x-auto scrollbar-hide h-full">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 text-center w-10">#</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600">Topic</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 text-center">Volume</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 text-center">CSAT</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 text-center">Drop-off</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 text-center">AHT</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 text-center">Is Resolved</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 text-center">Repeat</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 text-center">Escalation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                <AnimatePresence>
                                    {filteredIssues.map((issue) => {
                                        const iconBg =
                                            issue.rank <= 3 ? "bg-red-500/10 text-red-500" :
                                            issue.rank <= 7 ? "bg-amber-500/10 text-amber-500" :
                                            "bg-blue-500/10 text-blue-500";
                                        return (
                                            <motion.tr key={issue.name} layout
                                                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
                                                className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            >
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className="text-xs font-black text-zinc-600 tabular-nums">#{issue.rank}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110 shadow-lg shrink-0", iconBg)}>
                                                            <OctagonAlert className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-zinc-200 group-hover:text-white transition-colors">{issue.name}</p>
                                                            <p className="text-[10px] text-zinc-600 font-bold tracking-widest">{issue.category}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className="text-xs font-black text-white tabular-nums">{issue.volume.toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className={cn("inline-flex px-2 py-0.5 rounded-lg text-xs font-bold border tabular-nums",
                                                        parseInt(issue.csat) >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" :
                                                        parseInt(issue.csat) >= 70 ? "bg-amber-500/10 text-amber-400 border-amber-500/10" :
                                                        "bg-red-500/10 text-red-400 border-red-500/10"
                                                    )}>{issue.csat}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/10 tabular-nums">{issue.dropOff}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className="text-xs font-bold text-zinc-300 tabular-nums">{issue.aht}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border tabular-nums",
                                                        parseInt(issue.isResolved) >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" :
                                                        parseInt(issue.isResolved) >= 60 ? "bg-amber-500/10 text-amber-400 border-amber-500/10" :
                                                        "bg-red-500/10 text-red-400 border-red-500/10"
                                                    )}>
                                                        {parseInt(issue.isResolved) >= 70 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        {issue.isResolved}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className={cn("inline-flex px-2 py-0.5 rounded-lg text-xs font-bold border tabular-nums",
                                                        parseInt(issue.repeat) >= 30 ? "bg-red-500/10 text-red-400 border-red-500/10" :
                                                        parseInt(issue.repeat) >= 18 ? "bg-amber-500/10 text-amber-400 border-amber-500/10" :
                                                        "bg-zinc-800 text-zinc-400 border-white/5"
                                                    )}>{issue.repeat}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/10 tabular-nums">{issue.escalation}</span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                    {filteredIssues.length === 0 && (
                                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <td colSpan={9} className="px-8 py-12 text-center text-zinc-500 font-medium text-sm">
                                                No topics found matching your filters.
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-1 pb-1 shrink-0">
                    <p className="text-xs text-zinc-600 font-semibold tabular-nums">
                        Showing <span className="text-zinc-400">{safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, allIssues.length)}</span> of <span className="text-zinc-400">{allIssues.length}</span> topics
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600 font-bold tabular-nums">{safePage + 1} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
                            className="p-1.5 rounded-lg border border-white/5 bg-zinc-900 text-zinc-500 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
                            className="p-1.5 rounded-lg border border-white/5 bg-zinc-900 text-zinc-500 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
