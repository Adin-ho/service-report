import { useState } from "react";
import { Calendar, FileText, Hash, Save, Wallet } from "lucide-react";

type LineItem = {
  accNo: string;
  accountName: string;
  description: string;
  amount: string;
};

export default function FinanceVoucherForm() {
  const [header, setHeader] = useState({
    companyName: "PT.",
    address: "",
    payTo: "",
    totalAmount: "",
    inWords: "",
    date: "",
    voucherNo: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    { accNo: "", accountName: "", description: "", amount: "" },
    { accNo: "", accountName: "", description: "", amount: "" },
    { accNo: "", accountName: "", description: "", amount: "" },
  ]);

  const [note, setNote] = useState("");
  const [bank, setBank] = useState("");
  const [signers, setSigners] = useState({ prepared: "", processed: "", approved: "", received: "" });

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleItemChange = (index: number, field: keyof LineItem, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => setItems((prev) => [...prev, { accNo: "", accountName: "", description: "", amount: "" }]);

  const handleSave = () => {
    // Integrate submit logic/API here
    alert("Voucher disimpan (dummy). Sambungkan ke API untuk menyimpan data.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Finance</p>
          <h1 className="text-3xl font-semibold text-slate-900">Bank Payment Voucher</h1>
          <p className="text-sm text-slate-500">Form input voucher pembayaran bank.</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          <Save size={16} />
          Save Voucher
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600">
              <span>Company Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={header.companyName}
                onChange={(e) => setHeader((p) => ({ ...p, companyName: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span>Address</span>
              <textarea
                rows={2}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={header.address}
                onChange={(e) => setHeader((p) => ({ ...p, address: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm text-slate-600">
              <span>Pay To</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={header.payTo}
                onChange={(e) => setHeader((p) => ({ ...p, payTo: e.target.value }))}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-600">
                <span>Total Amount</span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <Wallet size={16} className="text-slate-400" />
                  <input
                    className="w-full text-sm text-slate-800 focus:outline-none"
                    value={header.totalAmount}
                    onChange={(e) => setHeader((p) => ({ ...p, totalAmount: e.target.value }))}
                  />
                </div>
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                <span>In Words</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={header.inWords}
                  onChange={(e) => setHeader((p) => ({ ...p, inWords: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-600">
                <span>Date</span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <Calendar size={16} className="text-slate-400" />
                  <input
                    type="date"
                    className="w-full text-sm text-slate-800 focus:outline-none"
                    value={header.date}
                    onChange={(e) => setHeader((p) => ({ ...p, date: e.target.value }))}
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
                    onChange={(e) => setHeader((p) => ({ ...p, voucherNo: e.target.value }))}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
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
              <span className="font-semibold">{items.length}</span>
            </div>
            <div className="flex justify-between text-emerald-200">
              <span>Grand Total</span>
              <span className="font-semibold">{total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
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
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100 bg-white">
          <table className="w-full min-w-[900px] border-collapse text-sm text-slate-800">
            <thead className="bg-slate-50 text-left font-semibold text-slate-900">
              <tr>
                <th className="border border-slate-200 px-3 py-2">Acc No</th>
                <th className="border border-slate-200 px-3 py-2">Account Name</th>
                <th className="border border-slate-200 px-3 py-2">Description</th>
                <th className="border border-slate-200 px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-slate-200 px-3 py-2">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600/30"
                      value={item.accNo}
                      onChange={(e) => handleItemChange(idx, "accNo", e.target.value)}
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600/30"
                      value={item.accountName}
                      onChange={(e) => handleItemChange(idx, "accountName", e.target.value)}
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600/30"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                    />
                  </td>
                  <td className="border border-slate-200 px-3 py-2">
                    <input
                      type="number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600/30"
                      value={item.amount}
                      onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-sm font-semibold text-slate-900">Total</div>
          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Rp {total.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="space-y-2 rounded-3xl border border-slate-100 bg-white/80 p-5 text-sm text-slate-600 shadow-sm">
          <span className="text-slate-800">Note</span>
          <textarea
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <label className="space-y-2 rounded-3xl border border-slate-100 bg-white/80 p-5 text-sm text-slate-600 shadow-sm">
          <span className="text-slate-800">Bank</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />
        </label>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Signatures</p>
        <h3 className="text-lg font-semibold text-slate-900">Prepared / Processed / Approved / Received</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["prepared", "processed", "approved", "received"].map((key) => (
            <label key={key} className="space-y-1 text-sm text-slate-600">
              <span className="capitalize">{key} by</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={(signers as any)[key]}
                onChange={(e) => setSigners((p) => ({ ...p, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
