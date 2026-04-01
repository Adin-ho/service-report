import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Eye, EyeOff, Loader2, Shield, UserPlus } from "lucide-react";

interface CreateUserForm {
  full_name: string;
  email: string;
  password: string;
}

interface ChangePasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface ApiUser {
  ID: number;
  FullName: string;
  Email: string;
  CreatedAt?: string;
  LastLoginAt?: string | null;
  Role?: { Name: string };
}

type FinanceRole = "FINANCE_MAKER" | "FINANCE_CHECKER" | "FINANCE_SIGNER";

export default function UserManagement() {
  const { user } = useAuth();
  const role = user?.role;
  const isMaster = role === "MASTER_ADMIN";
  const isAdmin = role === "ADMIN";

  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    reset: resetAdmin,
    formState: { isSubmitting: creatingAdmin },
  } = useForm<CreateUserForm>({
    defaultValues: { full_name: "", email: "", password: "" },
  });
  const {
    register: registerTeknisi,
    handleSubmit: handleSubmitTeknisi,
    reset: resetTeknisi,
    formState: { isSubmitting: creatingTeknisi },
  } = useForm<CreateUserForm>({
    defaultValues: { full_name: "", email: "", password: "" },
  });

  const {
    register: registerFinance,
    handleSubmit: handleSubmitFinance,
    reset: resetFinance,
    formState: { isSubmitting: creatingFinance },
  } = useForm<CreateUserForm & { role: FinanceRole }>({
    defaultValues: { full_name: "", email: "", password: "", role: "FINANCE_MAKER" },
  });

  const { register: registerChange, handleSubmit: handleSubmitChange, reset: resetChange } = useForm<ChangePasswordForm>();

  const [admins, setAdmins] = useState<ApiUser[]>([]);
  const [teknisi, setTeknisi] = useState<ApiUser[]>([]);
  const [financeUsers, setFinanceUsers] = useState<ApiUser[]>([]);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [teknisiStatus, setTeknisiStatus] = useState<string | null>(null);
  const [financeStatus, setFinanceStatus] = useState<string | null>(null);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingTeknisi, setLoadingTeknisi] = useState(false);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [changeStatus, setChangeStatus] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const res = await api.get("/admins");
      setAdmins(res.data?.data ?? []);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  const fetchTeknisi = useCallback(async () => {
    setLoadingTeknisi(true);
    try {
      const res = await api.get("/teknisi");
      setTeknisi(res.data?.data ?? []);
    } finally {
      setLoadingTeknisi(false);
    }
  }, []);

  const fetchFinance = useCallback(async () => {
    setLoadingFinance(true);
    try {
      const res = await api.get("/finance/users");
      setFinanceUsers(res.data?.data ?? []);
    } finally {
      setLoadingFinance(false);
    }
  }, []);

  useEffect(() => {
    if (isMaster) {
      fetchAdmins();
      fetchFinance();
    }
    if (isAdmin || isMaster) {
      fetchTeknisi();
    }
  }, [isMaster, isAdmin, fetchAdmins, fetchTeknisi, fetchFinance]);


  const submitAdmin = handleSubmitAdmin(async (values) => {
    setAdminStatus(null);
    try {
      await api.post("/admins", values);
      setAdminStatus("Admin account created successfully.");
      resetAdmin();
      fetchAdmins();
    } catch (err: any) {
      setAdminStatus(err?.response?.data?.error ?? "Failed to create admin.");
    }
  });

  const submitTeknisi = handleSubmitTeknisi(async (values) => {
    setTeknisiStatus(null);
    try {
      await api.post("/teknisi", values);
      setTeknisiStatus("Technician account created successfully.");
      resetTeknisi();
      fetchTeknisi();
    } catch (err: any) {
      setTeknisiStatus(err?.response?.data?.error ?? "Failed to create technician.");
    }
  });

  const submitFinance = handleSubmitFinance(async (values) => {
    setFinanceStatus(null);
    try {
      const role = values.role;
      const payload = { full_name: values.full_name, email: values.email, password: values.password };
      if (role === "FINANCE_MAKER") await api.post("/finance/users/maker", payload);
      else if (role === "FINANCE_CHECKER") await api.post("/finance/users/checker", payload);
      else await api.post("/finance/users/signer", payload);
      setFinanceStatus("Finance account created successfully.");
      resetFinance();
      fetchFinance();
    } catch (err: any) {
      setFinanceStatus(err?.response?.data?.error ?? "Failed to create finance user.");
    }
  });

  const infoCard = useMemo(() => {
    if (isMaster) {
      return {
        title: "Account Creation Flow",
        description: "Master Admins create admin accounts first. After logging in, admins can provision their own technicians.",
      };
    }
    return {
      title: "Security Tips",
      description: "Remind technicians to change their default password immediately after the first login.",
    };
  }, [isMaster]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">User Access</p>
          <h1 className="text-2xl font-semibold text-slate-900">Manage Accounts & Roles</h1>
          <p className="text-sm text-slate-500">Add admins or technicians according to the access hierarchy.</p>
        </div>
      </header>

      {isMaster && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create Admin Account</h2>
              <p className="text-sm text-slate-500">New admins can log in to manage technicians and reports.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              <UserPlus size={14} />
              Master Admin only
            </span>
          </div>
          <form onSubmit={submitAdmin} className="mt-6 grid gap-4 md:grid-cols-3">
            <Field label="Full Name" className="md:col-span-1">
              <input {...registerAdmin("full_name", { required: true })} className="input" placeholder="Aulia Rahman" />
            </Field>
            <Field label="Email">
              <input type="email" {...registerAdmin("email", { required: true })} className="input" placeholder="admin@corp.com" />
            </Field>
            <Field label="Temporary Password">
              <PasswordField register={registerAdmin("password", { required: true, minLength: 8 })} placeholder="Minimum 8 characters" />
            </Field>
            <div className="md:col-span-3 flex items-center gap-4">
              <button type="submit" disabled={creatingAdmin} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {creatingAdmin ? "Saving..." : "Add Admin"}
              </button>
              {adminStatus && <p className="text-sm text-slate-500">{adminStatus}</p>}
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin List</h3>
            <div className="mt-3 overflow-x-auto rounded-3xl border border-slate-100">
              {loadingAdmins ? (
                <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading admin data...
                </div>
              ) : admins.length === 0 ? (
                <p className="px-6 py-10 text-sm text-slate-500">No admins registered yet.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {admins.map((item) => {
                      const isRecent = item.LastLoginAt ? Date.now() - new Date(item.LastLoginAt).getTime() < 5 * 60 * 1000 : false;
                      const isOnline = isRecent || user?.id === item.ID;
                      return (
                      <tr key={item.ID}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{item.FullName}</span>
                            {isOnline && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                Online
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.Email}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(item.CreatedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <ResetPasswordInline endpoint={`/admins/${item.ID}/reset-password`} label="Reset Admin" />
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      {isMaster && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create Finance Account</h2>
              <p className="text-sm text-slate-500">Maker / Checker / Signer untuk alur finance.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              <UserPlus size={14} />
              Master Admin only
            </span>
          </div>
          <form onSubmit={submitFinance} className="mt-6 grid gap-4 md:grid-cols-4">
            <Field label="Full Name">
              <input {...registerFinance("full_name", { required: true })} className="input" placeholder="Finance User" />
            </Field>
            <Field label="Email">
              <input type="email" {...registerFinance("email", { required: true })} className="input" placeholder="finance@corp.com" />
            </Field>
            <Field label="Temporary Password">
              <PasswordField register={registerFinance("password", { required: true, minLength: 8 })} placeholder="Minimum 8 characters" />
            </Field>
            <Field label="Role">
              <select {...registerFinance("role", { required: true })} className="input">
                <option value="FINANCE_MAKER">Finance Maker</option>
                <option value="FINANCE_CHECKER">Finance Checker</option>
                <option value="FINANCE_SIGNER">Finance Signer</option>
              </select>
            </Field>
            <div className="md:col-span-4 flex items-center gap-4">
              <button type="submit" disabled={creatingFinance} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {creatingFinance ? "Saving..." : "Add Finance User"}
              </button>
              {financeStatus && <p className="text-sm text-slate-500">{financeStatus}</p>}
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Finance User List</h3>
            <div className="mt-3 overflow-x-auto rounded-3xl border border-slate-100">
              {loadingFinance ? (
                <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading finance users...
                </div>
              ) : financeUsers.length === 0 ? (
                <p className="px-6 py-10 text-sm text-slate-500">No finance users yet.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {financeUsers.map((item) => (
                      <tr key={item.ID}>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.FullName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.Email}</td>
                        <td className="px-4 py-3 text-slate-600">{item.Role?.Name ?? "FINANCE"}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(item.CreatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create Technician Account</h2>
              <p className="text-sm text-slate-500">Technicians are automatically linked to the admins who create them.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              <UserPlus size={14} />
              Admin only
            </span>
          </div>
          <form onSubmit={submitTeknisi} className="mt-6 grid gap-4 md:grid-cols-3">
            <Field label="Full Name">
              <input {...registerTeknisi("full_name", { required: true })} className="input" placeholder="Rendi - Technician" />
            </Field>
            <Field label="Email">
              <input type="email" {...registerTeknisi("email", { required: true })} className="input" placeholder="technician@corp.com" />
            </Field>
            <Field label="Temporary Password">
              <PasswordField register={registerTeknisi("password", { required: true, minLength: 8 })} placeholder="Minimum 8 characters" />
            </Field>
            <div className="md:col-span-3 flex items-center gap-4">
              <button type="submit" disabled={creatingTeknisi} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {creatingTeknisi ? "Saving..." : "Add Technician"}
              </button>
              {teknisiStatus && <p className="text-sm text-slate-500">{teknisiStatus}</p>}
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Technician List</h3>
            <div className="mt-3 overflow-x-auto rounded-3xl border border-slate-100">
              {loadingTeknisi ? (
                <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading technician data...
                </div>
              ) : teknisi.length === 0 ? (
                <p className="px-6 py-10 text-sm text-slate-500">No technicians registered yet.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {teknisi.map((item) => {
                      const isRecent = item.LastLoginAt ? Date.now() - new Date(item.LastLoginAt).getTime() < 5 * 60 * 1000 : false;
                      return (
                        <tr key={item.ID}>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{item.FullName}</span>
                              {isRecent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                  Online
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{item.Email}</td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(item.CreatedAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <ResetPasswordInline endpoint={`/teknisi/${item.ID}/reset-password`} label="Reset Technician" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Change My Password</h2>
            <p className="text-sm text-slate-500">All roles can update their own password here.</p>
          </div>
        </div>
        <form
          onSubmit={handleSubmitChange(async (values) => {
            setChangeStatus(null);
            try {
              await api.post("/auth/change-password", values);
              setChangeStatus("Password updated successfully.");
              resetChange();
            } catch (err: any) {
              setChangeStatus(err?.response?.data?.error ?? "Failed to change password.");
            }
          })}
          className="mt-6 grid gap-4 md:grid-cols-3"
        >
          <Field label="Current Password">
            <PasswordField register={registerChange("current_password", { required: true })} placeholder="Current password" />
          </Field>
          <Field label="New Password">
            <PasswordField register={registerChange("new_password", { required: true, minLength: 8 })} placeholder="Minimum 8 characters" />
          </Field>
          <Field label="Confirm Password">
            <PasswordField register={registerChange("confirm_password", { required: true })} placeholder="Repeat new password" />
          </Field>
          <div className="md:col-span-3 flex items-center gap-4">
            <button type="submit" className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
              Save Password
            </button>
            {changeStatus && <p className="text-sm text-slate-500">{changeStatus}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 text-slate-900">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{infoCard.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{infoCard.description}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-medium text-slate-600 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PasswordField({ register, placeholder, compact = false }: { register: UseFormRegisterReturn; placeholder?: string; compact?: boolean }) {
  const [visible, setVisible] = useState(false);
  const baseClass = compact
    ? "w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 pr-11 text-xs"
    : "input pr-11";
  return (
    <div className={`relative ${compact ? "" : ""}`}>
      <input type={visible ? "text" : "password"} {...register} className={baseClass} placeholder={placeholder} />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className={`absolute ${compact ? "right-2" : "right-3"} top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:text-slate-900`}
      >
        {visible ? <EyeOff size={compact ? 14 : 16} /> : <Eye size={compact ? 14 : 16} />}
      </button>
    </div>
  );
}

function ResetPasswordInline({ endpoint, label }: { endpoint: string; label: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.patch(endpoint);
      setStatus(res.data?.message ?? "Temporary password has been emailed.");
    } catch (err: any) {
      setStatus(err?.response?.data?.error ?? "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-500 disabled:opacity-60"
      >
        {loading ? "Sending..." : label}
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl text-left">
            <p className="text-base font-semibold text-slate-900">Reset password?</p>
            <p className="mt-2 text-sm text-slate-600">
              A new temporary password will be generated and emailed to this user.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-400"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={async () => {
                  await handleReset();
                  setConfirmOpen(false);
                }}
                disabled={loading}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {status && <span className="text-[11px] text-slate-500">{status}</span>}
    </div>
  );
}
