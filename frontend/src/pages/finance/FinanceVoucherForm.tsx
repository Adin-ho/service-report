import { useMemo, useState } from "react";
import { Calendar, FileText, Hash, Save, UploadCloud, Wallet, Send } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

type LineItem = {
  accNo: string;
  accountName: string;
  description: string;
  amount: string;
};

type CreateResponse = {
  id: number;
  status: string;
};

export default function FinanceVoucherForm() {
  const { user } = useAuth();
  const isMaker = user?.role === "FINANCE_MAKER";
  const isSigner = user?.role === "FINANCE_SIGNER";

  const [header, setHeader] = useState({
    companyName: "PT. Kanda Medical Solution Indonesia",
    address: "Ruko Natura Cattleya Utama No 0578 Pengasinan, Gunung Sindur kab Bogor - Jawa Barat 16340",
    payTo: "",
    totalAmount: "",
    inWords: "",
    date: "",
    voucherNo: "",
  });

  const [items, setItems] = useState<LineItem[]>([{ accNo: "", accountName: "", description: "", amount: "" }]);

  const [note, setNote] = useState("");
  const [bank, setBank] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [signers, setSigners] = useState({ processed: "", approved: "", received: "" });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedActivity, setSavedActivity] = useState<CreateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ payTo?: string; total?: string; items?: string }>({});

  const handleSignatureUpload = async (key: keyof typeof signers, fileList: FileList | null) => {
    if (!isSigner) return;
    if (!savedActivity?.id) {
      setError("Simpan atau pilih voucher terlebih dahulu sebelum upload QR.");
      return;
    }
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    try {
      const form = new FormData();
      form.append("qr_file", file);
      const { data } = await api.post(`/finance/activities/${savedActivity.id}/sign`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSigners((p) => ({ ...p, [key]: URL.createObjectURL(file) }));
      setSavedActivity(data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Gagal upload QR");
    } finally {
      /* noop */
    }
  };

  const normalizedItems = useMemo(
    () =>
      items.filter(
        (i) => i.accNo.trim() || i.accountName.trim() || i.description.trim() || Number(i.amount || 0) > 0
      ),
    [items]
  );

  const total = normalizedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleItemChange = (index: number, field: keyof LineItem, value: string) => {
    if (!isMaker) return;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    if (!isMaker) return;
    setItems((prev) => [...prev, { accNo: "", accountName: "", description: "", amount: "" }]);
  };

  const payload = useMemo(
    () => ({
      voucher_no: header.voucherNo,
      pay_to: header.payTo,
      total_amount: Number(header.totalAmount || 0),
      amount_in_words: header.inWords,
      bank_name: bank,
      bank_account: bankAccount,
      note,
      items: normalizedItems.map((i) => ({
        acc_no: i.accNo,
        account_name: i.accountName,
        description: i.description,
        amount: Number(i.amount || 0),
      })),
    }),
    [bank, bankAccount, header.inWords, header.payTo, header.totalAmount, header.voucherNo, normalizedItems, note]
  );

  const validate = (): string | null => {
    const errs: { payTo?: string; total?: string; items?: string } = {};
    if (!header.payTo.trim()) errs.payTo = "Isi 'Pay To'.";
    if (!header.totalAmount || Number(header.totalAmount) <= 0) errs.total = "Total Amount wajib diisi dan > 0.";
    if (normalizedItems.length === 0) {
      errs.items = "Tambah minimal 1 line item terisi.";
    } else {
      for (const [idx, item] of normalizedItems.entries()) {
        if (!item.accNo.trim() || !item.accountName.trim() || !item.amount || Number(item.amount) <= 0) {
          errs.items = `Lengkapi data pada baris terisi ke-${idx + 1} (Acc No, Account Name, Amount > 0).`;
          break;
        }
      }
    }
    setFieldErrors(errs);
    if (errs.payTo || errs.total || errs.items) return "Periksa input yang belum lengkap.";
    return null;
  };

  const handleSave = async () => {
    if (!isMaker) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(null);
    setFieldErrors({});
    try {
      const { data } = await api.post("/finance/activities", payload);
      const saved: CreateResponse = data.data;
      setSavedActivity(saved);
      setSaveSuccess(`Voucher tersimpan. ID: ${saved.id}. Status: ${saved.status}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Gagal menyimpan voucher");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const handleSubmit = async () => {
    if (!isMaker || !savedActivity?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(`/finance/activities/${savedActivity.id}/submit`);
      setSavedActivity(data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Gagal submit voucher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Finance</p>
          <h1 className="text-3xl font-semibold text-slate-900">Bank Payment Voucher</h1>
          <p className="text-sm text-slate-500">Form input voucher pembayaran bank.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span>Company Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={header.companyName}
                readOnly
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span>Address</span>
              <textarea
                rows={2}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 md:min-h-0"
                value={header.address}
                readOnly
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-1 text-sm text-slate-600">
              <span>Pay To</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={header.payTo}
                onChange={(e) => isMaker && setHeader((p) => ({ ...p, payTo: e.target.value }))}
                readOnly={!isMaker}
              />
              {fieldErrors.payTo && <p className="text-xs text-rose-600">{fieldErrors.payTo}</p>}
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span>Total Amount</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Wallet size={16} className="text-slate-400" />
                <input
                  className="w-full text-sm text-slate-800 focus:outline-none"
                  value={header.totalAmount}
                  onChange={(e) => isMaker && setHeader((p) => ({ ...p, totalAmount: e.target.value }))}
                  readOnly={!isMaker}
                />
              </div>
              {fieldErrors.total && <p className="text-xs text-rose-600">{fieldErrors.total}</p>}
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span>Date</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Calendar size={16} className="text-slate-400" />
                <input
                  type="date"
                  className="w-full text-sm text-slate-800 focus:outline-none"
                  value={header.date}
                  onChange={(e) => isMaker && setHeader((p) => ({ ...p, date: e.target.value }))}
                  readOnly={!isMaker}
                />
              </div>
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span>Voucher No</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Hash size={16} className="text-slate-400" />
                <input
                  className="w-full text-sm text-slate-800 focus:outline-none"
                  value={header.voucherNo}
                  onChange={(e) => isMaker && setHeader((p) => ({ ...p, voucherNo: e.target.value }))}
                  readOnly={!isMaker}
                />
              </div>
            </label>
          </div>

          <div className="grid gap-4 mt-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span>In Words</span>
              <textarea
                rows={2}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={header.inWords}
                onChange={(e) => isMaker && setHeader((p) => ({ ...p, inWords: e.target.value }))}
                readOnly={!isMaker}
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText size={16} />
            Voucher Summary
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between"><span>Company</span><span className="font-semibold text-slate-900">{header.companyName || "-"}</span></div>
            <div className="flex justify-between"><span>Pay To</span><span className="font-semibold text-slate-900">{header.payTo || "-"}</span></div>
            <div className="flex justify-between"><span>Total Amount</span><span className="font-semibold text-slate-900">{header.totalAmount || "0"}</span></div>
            <div className="flex justify-between"><span>Date</span><span className="text-slate-500">{header.date || "-"}</span></div>
            <div className="flex justify-between"><span>Voucher No</span><span className="text-slate-500">{header.voucherNo || "-"}</span></div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
            <div className="flex justify-between">
              <span>Total Items</span>
              <span className="font-semibold">{normalizedItems.length}</span>
            </div>
            <div className="flex justify-between text-emerald-200">
              <span>Grand Total</span>
              <span className="font-semibold">{total.toLocaleString("id-ID")}</span>
            </div>
            {savedActivity && (
              <div className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold">
                Saved ID: {savedActivity.id} • Status: {savedActivity.status}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Detail</p>
            <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
            <p className="text-sm text-slate-500">Acc No, Account Name, Description, Amount.</p>
          </div>
          <button
            onClick={addRow}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            + Add Row
          </button>
        </div>
        {fieldErrors.items && <p className="text-xs text-rose-600">{fieldErrors.items}</p>}
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <table className="w-full min-w-[720px] border-collapse text-sm text-slate-800">
              <thead className="bg-slate-100 text-left font-semibold text-slate-900">
                <tr>
                  <th className="border border-slate-200 px-3 py-2 text-left">Acc No</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">Account Name</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">Description</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-200 px-3 py-2">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-600/30"
                        value={item.accNo}
                        onChange={(e) => handleItemChange(idx, "accNo", e.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-600/30"
                        value={item.accountName}
                        onChange={(e) => handleItemChange(idx, "accountName", e.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-600/30"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      <input
                        type="number"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-600/30"
                        value={item.amount}
                        onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-sm font-semibold text-slate-900">Total</div>
          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Rp {total.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="space-y-2 rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <span className="text-slate-800">Note</span>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={note}
            onChange={(e) => isMaker && setNote(e.target.value)}
            readOnly={!isMaker}
          />
        </label>
        <label className="space-y-2 rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <span className="text-slate-800">Bank</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={bank}
            onChange={(e) => isMaker && setBank(e.target.value)}
            readOnly={!isMaker}
          />
        </label>
      </div>

      {isMaker && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              const msg = validate();
              if (msg) {
                setError(msg);
                setShowConfirm(false);
                return;
              }
              setShowConfirm(true);
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Voucher"}
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveSuccess}
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Signatures</p>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Processed / Approved / Received</h3>
            <p className="mt-1 text-xs text-slate-500">Upload QR oleh signer saja.</p>
          </div>
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["processed", "approved", "received"].map((key) => {
            const label = {
              processed: "Processed By",
              approved: "Approved By",
              received: "Received By",
            }[key as keyof typeof signers];
            const preview = signers[key as keyof typeof signers];
            const canUpload = isSigner;
            return (
              <div key={key} className="space-y-2 text-sm text-slate-600">
                <span className="text-slate-800">{label}</span>
                {preview ? (
                  <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <img src={preview} alt={`${label} QR`} className="h-full w-full object-contain" />
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
                      accept="image/*"
                      className="hidden"
                      disabled={!canUpload}
                      onChange={(e) => canUpload && handleSignatureUpload(key as keyof typeof signers, e.target.files)}
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
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => canUpload && handleSignatureUpload(key as keyof typeof signers, e.target.files)}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isMaker && (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={!savedActivity?.id || submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
          >
            <Send size={16} />
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Simpan voucher?</h3>
            <p className="mt-2 text-sm text-slate-600">Pastikan data sudah benar sebelum menyimpan voucher ke sistem.</p>
            <div className="mt-4 flex justify-end gap-2 text-sm">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Menyimpan..." : "Ya, simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
