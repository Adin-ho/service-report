import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Bell, History, LayoutGrid, Loader, LogOut, Menu, X, ListChecks, Wallet } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/finance", label: "Finance Dashboard", icon: LayoutGrid },
  { to: "/finance/activity", label: "Finance Activity", icon: ListChecks },
  { to: "/finance/history", label: "History Activity", icon: History },
  { to: "/finance/voucher", label: "Payment Voucher", icon: Wallet },
];

export default function FinanceShell() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigation = useMemo(() => navItems, []);

  return (
    <div className="dashboard-shell flex min-h-screen flex-col bg-slate-50 text-slate-900 lg:h-screen lg:flex-row">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white/90 backdrop-blur-md transition-all duration-300 lg:static lg:z-auto lg:h-full",
          collapsed ? "lg:w-20" : "lg:w-72",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 font-semibold text-white">SR</div>
          {!collapsed && (
            <div>
              <p className="font-semibold tracking-wide">Service Report</p>
              <p className="text-xs text-slate-500">Finance Dashboard</p>
            </div>
          )}
          <button
            className="ml-auto rounded-full border border-slate-200 p-2 text-slate-400 transition hover:text-slate-600 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 space-y-2 px-3">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
                )
              }
              end={to === "/finance"}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon size={18} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 pb-6">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
          >
            <LogOut size={16} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
            <button
              className="hidden rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 lg:inline-flex"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar width"
            >
              <Menu size={18} />
            </button>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Hello, {user?.name ?? "User"}</span>
            <span className="text-sm text-slate-500">{user?.role ?? "Finance"}</span>
          </div>
          <div className="ml-auto flex w-full flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
            <div className="relative w-full min-w-[180px] flex-1 sm:w-64 lg:w-80">
              <input
                placeholder="Search files..."
                className="w-full rounded-full border border-transparent bg-slate-100 py-2.5 pl-11 pr-4 text-sm text-slate-600 outline-none ring-offset-2 focus:border-slate-200 focus:ring-2 focus:ring-slate-200"
              />
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="9" cy="9" r="5" />
                <path d="m14 14 4 4" strokeLinecap="round" />
              </svg>
            </div>
            <button className="rounded-full border border-slate-200 p-2 text-slate-600 hover:text-slate-900">
              <Bell size={18} />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              {user?.name?.[0] ?? <Loader size={16} className="animate-spin" />}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
