import { useState } from "react";
import { useProfile } from "@presentation/hooks/useProfile";
import { AppShell } from "@presentation/components/AppShell";
import { RoleBadge } from "@presentation/components/RoleBadge";
import { useAuth } from "@presentation/hooks/useAuth";
import { User as UserIcon, Save, Loader2 } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, error, updateProfile } = useProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEdit() {
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile({ firstName, lastName });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-brand-600 h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="text-center text-red-600">{error}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Profile</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="bg-brand-50 flex h-16 w-16 items-center justify-center rounded-full">
              <UserIcon className="text-brand-600 h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "Your Profile"}
              </h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {profile && (
                <div className="mt-1">
                  <RoleBadge role={profile.role} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                    }}
                    className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.firstName || <span className="text-gray-400">—</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                    }}
                    className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.lastName || <span className="text-gray-400">—</span>}
                  </p>
                )}
              </div>
            </div>

            {saveError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</div>
            )}

            <div className="flex gap-2 pt-2">
              {editing ? (
                <>
                  <button
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                    }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={startEdit}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
