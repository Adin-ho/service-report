import FinanceVoucherForm from "./FinanceVoucherForm";

export default function FinanceActivity() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Finance</p>
        <h1 className="text-3xl font-semibold text-slate-900">Finance Activity</h1>
        <p className="text-sm text-slate-500">Bank Payment Voucher berada di sini.</p>
      </div>
      <FinanceVoucherForm />
    </div>
  );
}
