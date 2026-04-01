import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, UploadCloud, XCircle } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

import type { Activity } from "./FinanceHistory";

type Item = NonNullable<Activity["items"]>[number];

const statusStyle: Record<string, string> = {
  DONE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
};

function displayStatus(status?: string) {
  const isDone = status === "SIGNED";
  return {
    label: isDone ? "DONE" : "PENDING",
    className: isDone ? statusStyle.DONE : statusStyle.PENDING,
  };
}

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
  const [signatureFiles, setSignatureFiles] = useState<{ processed?: File; approved?: File; received?: File }>({});
  const [signaturePreview, setSignaturePreview] = useState<{ processed?: string; approved?: string; received?: string }>({});
  const [submitFeedback, setSubmitFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [previewModal, setPreviewModal] = useState<{ src: string; label: string } | null>(null);

  const isSigner = user?.role === "FINANCE_SIGNER";
  const storageKey = isSigner && id ? `finance-signature-previews-${id}-user-${user?.id ?? "unknown"}` : null;

  const persistPreviews = (next: { processed?: string; approved?: string; received?: string }) => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const itemsTotal = (data?.items ?? []).reduce((sum, it) => sum + Number(it.amount || 0), 0);

  const fetchDetail = async (activityId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/finance/activities/${activityId}`);
      setData(res.data?.data ?? null);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Gagal memuat detail";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    if (isSigner && storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSignaturePreview(parsed);
        } catch (_) {
          /* ignore */
        }
      }
    } else {
      setSignaturePreview({});
    }
    fetchDetail(id);
  }, [id, storageKey, isSigner]);

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
                  {(() => {
                    const s = displayStatus(data.status);
                    return (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>
                        {s.label}
                      </span>
                    );
                  })()}
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
                <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  <table className="min-w-[640px] text-sm">
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
                {["processed", "approved", "received"].map((key) => {
                  const labelMap: Record<string, string> = { processed: "Processed By", approved: "Approved By", received: "Received By" };
                  const preview = signaturePreview[key as keyof typeof signaturePreview] || "";
                  const canUpload = user?.role === "FINANCE_SIGNER";
                  return (
                    <div key={key} className="space-y-2 text-sm text-slate-600">
                      <span className="text-slate-800">{labelMap[key]}</span>
                      {preview ? (
                        <button
                          type="button"
                          onClick={() => setPreviewModal({ src: preview, label: labelMap[key] })}
                          className="flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                        >
                          <img src={preview} alt="QR" className="h-full w-full object-contain" />
                        </button>
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
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file || !canUpload) return;
                              setSignatureFiles((prev) => ({ ...prev, [key]: file }));
                              const reader = new FileReader();
                              reader.onload = () => {
                                setSignaturePreview((prev) => {
                                  const next = { ...prev, [key]: String(reader.result) };
                                  persistPreviews(next);
                                  return next;
                                });
                              };
                              reader.readAsDataURL(file);
                              setUploadError(null);
                              setUploadSuccess(null);
                            }}
                          />
                        </label>
                      )}
                      <div className="text-xs text-slate-500">
                        <div>Signer ID: {data.signer_id ?? "-"}</div>
                        <div>Signed At: {data.signed_at ? formatDateTime(data.signed_at) : "-"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {user?.role === "FINANCE_SIGNER" && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">Submit setelah seluruh QR diunggah.</p>
                  <button
                    onClick={async () => {
                      const files = signatureFiles;
                      const order = ["processed", "approved", "received"] as const;
                      const chosenKey = order.find((k) => files[k]);
                      const chosen = chosenKey ? files[chosenKey] : undefined;
                      if (!chosen) {
                        setUploadError("Upload minimal 1 QR terlebih dahulu.");
                        return;
                      }
                      setUploading(true);
                      setUploadError(null);
                      setUploadSuccess(null);
                      setSubmitFeedback(null);
                      try {
                        const form = new FormData();
                        form.append("qr_file", chosen);
                        const res = await api.post(`/finance/activities/${data.id}/sign`, form, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        setData(res.data?.data ?? data);
                        setUploadSuccess("Signature submitted.");
                        // Keep per-slot previews/files so they don't disappear after submit.
                        setSignatureFiles((prev) => ({ ...prev }));
                        if (storageKey) {
                          persistPreviews(signaturePreview);
                        }
                        setSubmitFeedback({ status: "success", message: "QR signature berhasil disubmit." });
                      } catch (err: any) {
                        const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Gagal upload QR";
                        setUploadError(msg);
                        setSubmitFeedback({ status: "error", message: msg });
                      } finally {
                        setUploading(false);
                      }
                    }}
                    disabled={uploading || data.status === "SIGNED"}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow ${
                      data.status === "SIGNED"
                        ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    }`}
                  >
                    {data.status === "SIGNED" ? "Signature Completed" : "Submit Signature"}
                  </button>
                </div>
              )}
              {submitFeedback && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/40 px-4">
                  <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${
                          submitFeedback.status === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {submitFeedback.status === "success" ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-slate-900">{submitFeedback.status === "success" ? "Berhasil" : "Gagal"}</p>
                        <p className="text-sm text-slate-600">{submitFeedback.message}</p>
                        {submitFeedback.status === "success" && (
                          <p className="text-xs text-slate-500">Status akan berubah menjadi DONE setelah response tersimpan.</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setSubmitFeedback(null)}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {previewModal && (
                <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/75 px-4" onClick={() => setPreviewModal(null)}>
                  <div className="relative w-full max-w-2xl rounded-3xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Preview</p>
                        <p className="text-sm font-semibold text-slate-800">{previewModal.label}</p>
                      </div>
                      <button
                        onClick={() => setPreviewModal(null)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Tutup
                      </button>
                    </div>
                    <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                      <img src={previewModal.src} alt={previewModal.label} className="h-full max-h-[70vh] w-full object-contain" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
