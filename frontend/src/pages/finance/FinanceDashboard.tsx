import React, { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Clock3,
  DollarSign,
  History,
  ListChecks,
} from "lucide-react";
import { api } from "../../lib/api";

const monthlyActivity = [
  { month: "Jan", value: 18 },
  { month: "Feb", value: 22 },
  { month: "Mar", value: 15 },
  { month: "Apr", value: 28 },
  { month: "May", value: 32 },
  { month: "Jun", value: 24 },
];

type Activity = {
  id: number;
  voucher_no: string;
  status: string;
  pay_to: string;
  total_amount: number;
  created_at?: string;
};

const statusColor: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  SIGNED: "bg-indigo-100 text-indigo-700",
};

function formatDate(val?: string) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
  trend,
  accent = "bg-slate-900",
}: {
  title: string;
  value: string;
  caption: string;
  icon: React.ElementType;
  trend?: { label: string; positive?: boolean };
  accent?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{caption}</p>
        </div>
        <div className={`${accent} text-white flex h-12 w-12 items-center justify-center rounded-2xl`}>
          <Icon size={22} />
        </div>
      </div>
      {trend && (
        <div
          className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
        >
          {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend.label}
        </div>
      )}
    </div>
  );
}

export default function FinanceDashboard() {
  const [history, setHistory] = useState<Activity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await api.get("/finance/activities");
        setHistory(res.data?.data ?? []);
      } catch (err: any) {
        setHistoryError(err?.response?.data?.error || "Gagal memuat data");
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const total = monthlyActivity.reduce((acc, item) => acc + item.value, 0);
  const maxValue = Math.max(...monthlyActivity.map((m) => m.value));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Finance</p>
        <div className="flex flex-wrap items-end gap-3">
          <h1 className="text-3xl font-semibold text-slate-900">Finance Dashboard</h1>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Internal</span>
        </div>
        <p className="text-sm text-slate-500">Ringkasan aktivitas keuangan terbaru dan histori.</p>
      </div>

      <section className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Pengeluaran"
            value="Rp 45.300.000"
            caption="Periode berjalan"
            icon={DollarSign}
            accent="bg-slate-900"
            trend={{ label: "+8.2% vs last month", positive: true }}
          />
          <StatCard
            title="Activity Bulanan"
            value={`${total} transaksi`}
            caption="Akumulasi 6 bulan"
            icon={BarChart3}
            accent="bg-slate-700"
          />
          <StatCard
            title="Pending Approval"
            value="12 aktivitas"
            caption="Menunggu ACC"
            icon={Clock3}
            accent="bg-amber-500"
          />
          <StatCard
            title="Approved"
            value="46 aktivitas"
            caption="Disetujui finance"
            icon={CheckCircle}
            accent="bg-emerald-600"
          />
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-4 xl:col-span-8">
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Grafik batang</p>
                <h3 className="text-xl font-semibold text-slate-900">Activity per Bulan</h3>
                <p className="text-sm text-slate-500">Jumlah pengajuan & pengeluaran per bulan.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <ListChecks size={14} />
                6 bulan terakhir
              </div>
            </div>
            <div className="mt-6 h-64 w-full rounded-2xl bg-slate-50 p-4">
              <div className="grid h-full grid-cols-6 items-end gap-3 sm:gap-4">
                {monthlyActivity.map((item) => (
                  <div key={item.month} className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        className="w-full rounded-lg bg-gradient-to-t from-slate-900 to-slate-600"
                        style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: "16px" }}
                        aria-label={`${item.month} ${item.value}`}
                      />
                    </div>
                    <span>{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 grid gap-4 xl:col-span-4">
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quick stats</p>
                <h3 className="text-lg font-semibold text-slate-900">Status Activity</h3>
              </div>
              <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Live</div>
            </div>
            <div className="mt-5 space-y-3">
              {[{ label: "Pending", value: 12, color: "bg-amber-400" }, { label: "Approved", value: 46, color: "bg-emerald-500" }, { label: "Rejected", value: 4, color: "bg-rose-400" }].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="flex-1 text-sm font-semibold text-slate-700">{item.label}</span>
                  <span className="text-sm text-slate-500">{item.value} aktivitas</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-900 p-6 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <History size={18} />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Summary</p>
                <h3 className="text-lg font-semibold">Aktivitas Bulan Ini</h3>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><span>Pengajuan baru</span><span className="font-semibold">18</span></div>
              <div className="flex justify-between"><span>Disetujui</span><span className="font-semibold">46</span></div>
              <div className="flex justify-between"><span>Menunggu ACC</span><span className="font-semibold">12</span></div>
              <div className="flex justify-between"><span>Total dana terserap</span><span className="font-semibold">Rp 45.3jt</span></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">History Activity</p>
              <h3 className="text-xl font-semibold text-slate-900">Log Aktivitas Keuangan</h3>
              <p className="text-sm text-slate-500">Tabel ringkasan (hanya melihat, tanpa detail).</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <History size={14} />
              Terakhir update {formatDate(new Date().toISOString())}
            </div>
          </div>
          {historyError && <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{historyError}</div>}
          {historyLoading ? (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">Memuat data...</div>
          ) : history.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Belum ada aktivitas.</div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead>
                  <tr className="text-xs uppercase text-slate-400">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Voucher No</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pay To</th>
                    <th className="px-4 py-3 text-right">Jumlah</th>
                    <th className="px-4 py-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">#{row.id}</td>
                      <td className="px-4 py-3">{row.voucher_no || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[row.status] || "bg-slate-100 text-slate-700"}`}>
                          {row.status || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.pay_to || "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold">Rp {Number(row.total_amount || 0).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
