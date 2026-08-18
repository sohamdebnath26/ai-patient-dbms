import { useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import { ConfirmDialog } from "@presentation/components/ConfirmDialog";
import { RoleBadge } from "@presentation/components/RoleBadge";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { Trash2, ShieldAlert } from "lucide-react";

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const { profile } = useProfile();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDeleteAccount = profile?.role === "doctor";

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      void navigate("/auth/login", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account and preferences.</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">Account</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Role</span>
              {profile && <RoleBadge role={profile.role} />}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Delete My Account</h2>
              <p className="mt-1 text-sm text-gray-600">
                Permanently delete your account. Patients you created and their history are
                preserved. This action cannot be undone.
              </p>
            </div>
          </div>

          {!canDeleteAccount && (
            <p className="mt-3 text-sm text-gray-500">Only doctors can delete their own account.</p>
          )}

          {deleteError && (
            <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {deleteError}
            </div>
          )}

          {canDeleteAccount && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setDeleteOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete My Account"
        message="This will permanently delete your account and sign you out. Patients and their medical history will be preserved."
        confirmLabel="Delete Account"
        confirmationText="DELETE MY ACCOUNT"
        loading={deleting}
        onCancel={() => {
          setDeleteOpen(false);
        }}
        onConfirm={() => {
          void handleDeleteAccount();
        }}
      />
    </AppShell>
  );
}
