import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

export type Activity = {
  id: number;
  voucher_no: string;
  status: string;
  pay_to: string;
  total_amount: number;
  bank_name?: string;
  bank_account?: string;
  amount_in_words?: string;
  note?: string;
  created_at?: string;
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  rejected_at?: string;
  signed_at?: string;
  checker_id?: number;
  signer_id?: number;
  qr_file?: string | null;
  items?: Array<{ acc_no: string; account_name: string; description: string; amount: number }>;
};

function displayStatus(status?: string) {
  const isDone = status === "SIGNED";
  return {
    label: isDone ? "DONE" : "PENDING",
    className: isDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
  };
}

function formatDate(val?: string) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FinanceHistory() {
  const { user } = useAuth();
  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const roleLabel = useMemo(() => user?.role || "FINANCE", [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/finance/activities");
        const rows = res.data?.data ?? [];
        setData([...rows].sort((a: Activity, b: Activity) => b.id - a.id));
      } catch (err: any) {
        setError(err?.response?.data?.error || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Finance</p>
        <h1 className="text-3xl font-semibold text-slate-900">History Activity</h1>
        <p className="text-sm text-slate-500">Riwayat voucher berdasarkan peran {roleLabel}.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">History Activity</p>
            <h3 className="text-lg font-semibold text-slate-900">Log Aktivitas Keuangan</h3>
            <p className="text-sm text-slate-500">Ringkasan voucher yang sudah dibuat.</p>
          </div>
          <div className="text-xs text-slate-400">Terakhir update {formatDate(new Date().toISOString())}</div>
        </div>

        {error && <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {loading ? (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Belum ada aktivitas.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100">
            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <table className="min-w-[720px] divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Voucher No</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pay To</th>
                    <th className="px-4 py-3 text-right">Jumlah</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">#{row.id}</td>
                      <td className="px-4 py-3 text-slate-700">{row.voucher_no}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const s = displayStatus(row.status);
                          return (
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${s.className}`}>
                              {s.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.pay_to || "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">Rp {Number(row.total_amount || 0).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(row.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/finance/history/${row.id}`)}
                          className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
