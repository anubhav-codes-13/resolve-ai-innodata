"use client";

import Link from "next/link";
import { LayoutDashboard, MessageSquare, Home, Settings, LogOut, Menu, X, Monitor } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#050505] text-zinc-400 font-sans">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-lg border border-white/10"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-white/5 flex flex-col p-6 bg-black transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
                <div className="flex items-center justify-between mb-10 px-2 lg:block lg:mb-10">
                    <div className="flex items-center gap-2 text-white">
                        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span className="font-bold tracking-tight">Admin Console</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1">
                    <NavItem href="/admin/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={pathname === "/admin/dashboard"} />
                    <NavItem href="/admin/monitoring" icon={<Monitor className="w-4 h-4" />} label="Monitoring" active={pathname === "/admin/monitoring"} />
                    <NavItem href="/admin/issues" icon={<MessageSquare className="w-4 h-4" />} label="Issue Insights" active={pathname === "/admin/issues"} />
                    {/* <NavItem href="/admin/analytics" icon={<PieChart className="w-4 h-4" />} label="Analytics" active={pathname === "/admin/analytics"} /> */}
                    {/* <NavItem href="/admin/alerts" icon={<Bell className="w-4 h-4" />} label="Alerts" active={pathname === "/admin/alerts"} badge="2" /> */}
                </nav>

                <div className="mt-auto space-y-1 pt-6 border-t border-white/5">
                    <NavItem href="/" icon={<Home className="w-4 h-4" />} label="Public View" />
                    <NavItem href="#" icon={<Settings className="w-4 h-4" />} label="Settings" />
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:text-white transition-colors group">
                        <LogOut className="w-4 h-4 text-zinc-600 group-hover:text-red-500 transition-colors" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black">
                    <h2 className="text-sm font-semibold text-white">
                        {pathname?.split("/").pop()?.toUpperCase() || "DASHBOARD"}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-lg text-[10px] text-zinc-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            PROD-SOUTH-1A: <span className="text-emerald-500">OPTIMAL</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 border border-white/20 p-[1px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full bg-zinc-800 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-hide">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label, active, badge }: { href: string, icon: React.ReactNode, label: string, active?: boolean, badge?: string }) {
    return (
        <Link
            href={href}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all group relative overflow-hidden ${active ? "bg-white/5 text-white" : "hover:bg-white/5 hover:text-white"
                }`}
        >
            {active && (
                <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-5 bg-blue-600 rounded-full"
                />
            )}
            <div className="flex items-center gap-3">
                <span className={active ? "text-blue-500" : "text-zinc-500 group-hover:text-blue-500 transition-colors"}>{icon}</span>
                {label}
            </div>
            {badge && <span className="bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg shadow-red-500/5">{badge}</span>}
        </Link>
    );
}
