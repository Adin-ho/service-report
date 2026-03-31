import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

import type { Activity } from "./FinanceHistory";

type Item = NonNullable<Activity["items"]>[number];

const statusStyle: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  SIGNED: "bg-indigo-100 text-indigo-700",
};

function formatDate(val?: string) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(val?: string) {
  if (!val) return "-";
  return new Date(val).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const defaultCompany = {
  name: "PT. Kanda Medical Solution Indonesia",
  address: "Ruko Natura Cattleya Utama No 0578 Pengasinan, Gunung Sindur kab Bogor - Jawa Barat 16340",
};

function formatCurrency(val?: number) {
  return `Rp ${Number(val || 0).toLocaleString("id-ID")}`;
}

export default function FinanceHistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const itemsTotal = (data?.items ?? []).reduce((sum, it) => sum + Number(it.amount || 0), 0);
  const baseURL = api.defaults.baseURL || "";

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/finance/activities/${id}`);
        setData(res.data?.data ?? null);
      } catch (err: any) {
        const message = err?.response?.data?.message || "Gagal memuat detail";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Finance</p>
          <h1 className="text-3xl font-semibold text-slate-900">Bank Payment Voucher</h1>
          <p className="text-sm text-slate-500">Voucher yang sudah diisi ditampilkan di bawah.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Kembali
        </button>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm sm:p-6">
        {loading && <div className="text-sm text-slate-600">Memuat...</div>}
        {error && !loading && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Detail Voucher</p>
                <h2 className="text-xl font-semibold text-slate-900">#{data.id} — {data.voucher_no || "-"}</h2>
                <div className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600">
                  <span>Status:</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[data.status] || "bg-slate-100 text-slate-700"}`}>
                    {data.status || "-"}
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-1">
                <div>Dibuat: {formatDateTime(data.created_at)}</div>
                <div>Pay To: {data.pay_to || "-"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-600">
                    <span>Company Name</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      value={defaultCompany.name}
                      readOnly
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span>Address</span>
                    <textarea
                      rows={2}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 md:min-h-0"
                      value={defaultCompany.address}
                      readOnly
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <label className="space-y-1 text-sm text-slate-600">
                    <span>Pay To</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      value={data.pay_to || "-"}
                      readOnly
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span>Total Amount</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      value={formatCurrency(data.total_amount)}
                      readOnly
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span>Date</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      value={formatDate(data.created_at)}
                      readOnly
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span>Voucher No</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      value={data.voucher_no || "-"}
                      readOnly
                    />
                  </label>
                </div>

                <label className="space-y-1 text-sm text-slate-600">
                  <span>In Words</span>
                  <textarea
                    rows={2}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    value={data.amount_in_words || "-"}
                    readOnly
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-600">
                    <span>Bank</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      value={data.bank_name || "-"}
                      readOnly
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span>Bank Account</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      value={data.bank_account || "-"}
                      readOnly
                    />
                  </label>
                </div>

                <label className="space-y-1 text-sm text-slate-600">
                  <span>Note</span>
                  <textarea
                    rows={2}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    value={data.note || "-"}
                    readOnly
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-slate-900 bg-slate-900 p-4 text-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">Voucher Summary</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Company</span><span className="font-semibold text-white">{defaultCompany.name}</span></div>
                  <div className="flex justify-between"><span>Pay To</span><span>{data.pay_to || "-"}</span></div>
                  <div className="flex justify-between"><span>Total Amount (Header)</span><span className="font-semibold text-white">{formatCurrency(data.total_amount)}</span></div>
                  <div className="flex justify-between"><span>Line Items Total</span><span className="font-semibold text-white">{formatCurrency(itemsTotal)}</span></div>
                  <div className="flex justify-between"><span>Date</span><span>{formatDate(data.created_at)}</span></div>
                  <div className="flex justify-between"><span>Voucher No</span><span>{data.voucher_no || "-"}</span></div>
                  <div className="flex justify-between"><span>Bank Account</span><span>{data.bank_account || "-"}</span></div>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                  <div className="flex justify-between"><span>Total Items</span><span className="font-semibold text-white">{(data.items ?? []).length}</span></div>
                  <div className="flex justify-between"><span>Grand Total (Line Items)</span><span className="font-semibold text-white">{formatCurrency(itemsTotal)}</span></div>
                </div>
                <div className="mt-4 space-y-1 text-xs text-slate-200">
                  <div className="flex justify-between"><span>Submitted</span><span>{data.submitted_at ? formatDateTime(data.submitted_at) : "-"}</span></div>
                  <div className="flex justify-between"><span>Reviewed</span><span>{data.reviewed_at ? formatDateTime(data.reviewed_at) : "-"}</span></div>
                  <div className="flex justify-between"><span>Approved</span><span>{data.approved_at ? formatDateTime(data.approved_at) : "-"}</span></div>
                  <div className="flex justify-between"><span>Rejected</span><span>{data.rejected_at ? formatDateTime(data.rejected_at) : "-"}</span></div>
                  <div className="flex justify-between"><span>Signed</span><span>{data.signed_at ? formatDateTime(data.signed_at) : "-"}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Detail</p>
                  <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
                  <p className="text-sm text-slate-500">Acc No, Account Name, Description, Amount.</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Acc No</th>
                      <th className="px-3 py-2 text-left">Account Name</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data.items ?? []).map((it: Item, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{it.acc_no || "-"}</td>
                        <td className="px-3 py-2">{it.account_name || "-"}</td>
                        <td className="px-3 py-2 text-slate-600">{it.description || "-"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatCurrency(it.amount)}</td>
                      </tr>
                    ))}
                    {(data.items ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-3 text-center text-sm text-slate-500">Tidak ada item.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Signatures</p>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Processed / Approved / Received</h3>
                  <p className="mt-1 text-xs text-slate-500">Upload QR oleh signer saja.</p>
                </div>
                {uploadError && <span className="text-sm text-rose-600">{uploadError}</span>}
                {uploadSuccess && <span className="text-sm text-emerald-600">{uploadSuccess}</span>}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {["Processed By", "Approved By", "Received By"].map((label) => {
                  const preview = data.qr_file ? (data.qr_file.startsWith("http") ? data.qr_file : `${baseURL}${data.qr_file}`) : "";
                  const canUpload = user?.role === "FINANCE_SIGNER";
                  return (
                    <div key={label} className="space-y-2 text-sm text-slate-600">
                      <span className="text-slate-800">{label}</span>
                      {preview ? (
                        <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <img src={preview} alt="QR" className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <label
                          className={`flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gradient-to-br from-slate-100 via-slate-50 to-white text-center text-sm font-semibold text-slate-600 ${
                            canUpload ? "cursor-pointer border-slate-300 hover:border-slate-400" : "cursor-not-allowed border-slate-200 text-slate-400"
                          }`}
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow">
                            <UploadCloud className="h-5 w-5 text-slate-500" />
                          </div>
                          <span className="mt-2 text-sm font-semibold">Upload QR</span>
                          <span className="text-[11px] text-slate-400">PNG/JPG up to 5MB</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            disabled={!canUpload}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !data?.id || !canUpload) return;
                              setUploading(true);
                              setUploadError(null);
                              setUploadSuccess(null);
                              try {
                                const form = new FormData();
                                form.append("qr_file", file);
                                const res = await api.post(`/finance/activities/${data.id}/sign`, form, {
                                  headers: { "Content-Type": "multipart/form-data" },
                                });
                                setData(res.data?.data ?? data);
                                setUploadSuccess("QR berhasil diunggah.");
                              } catch (err: any) {
                                setUploadError(err?.response?.data?.error || "Gagal upload QR");
                              } finally {
                                setUploading(false);
                              }
                            }}
                          />
                        </label>
                      )}
                      {preview && canUpload && (
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Uploaded QR</span>
                          <label className="cursor-pointer font-semibold text-slate-700">
                            Ganti file
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !data?.id || !canUpload) return;
                                setUploading(true);
                                setUploadError(null);
                                setUploadSuccess(null);
                                try {
                                  const form = new FormData();
                                  form.append("qr_file", file);
                                  const res = await api.post(`/finance/activities/${data.id}/sign`, form, {
                                    headers: { "Content-Type": "multipart/form-data" },
                                  });
                                  setData(res.data?.data ?? data);
                                  setUploadSuccess("QR berhasil diunggah.");
                                } catch (err: any) {
                                  setUploadError(err?.response?.data?.error || "Gagal upload QR");
                                } finally {
                                  setUploading(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        <div>Signer ID: {data.signer_id ?? "-"}</div>
                        <div>Signed At: {data.signed_at ? formatDateTime(data.signed_at) : "-"}</div>
                      </div>
                      {uploading && <p className="text-xs text-slate-500">Mengunggah...</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
