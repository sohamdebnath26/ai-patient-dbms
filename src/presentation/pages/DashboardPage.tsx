import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useProfile } from "@presentation/hooks/useProfile";
import { resolveAuthScope } from "@domain/patient";
import type { AuthorizationContext } from "@domain/patient";
import { useNavigate } from "react-router";
import { AppShell } from "@presentation/components/AppShell";
import { useAuth as useFirebaseAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

function useAuthContext(): AuthorizationContext {
  const { user } = useAuth();
  const navigate = useNavigate();
  return {
    userId: user?.id ?? "",
    selectedOrganizationId: null,
    selectedClinicId: null,
  };
}

function useDashboardSummary(auth: AuthorizationContext) {
  const navigate = useNavigate();
  const db = getFirestore();
  const { currentUser } = useFirebaseAuth();
  
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      try {
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        
        let patientCount = 0;
        let todayAppointments = 0;
        let activeEncounters = 0;
        let completedToday = 0;

        if (currentUser?.uid) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const userData = userDoc.data();
          const organizationId = userData?.organization_id || "org1";
          const clinicId = userData?.clinic_id || "clinic1";

          const patientPromise = getDoc(doc(db, "organizations", organizationId, "patients", "_meta"))
            .then(meta => {
              const total = meta.data()?.total_patients || 0;
              const active = meta.data()?.active_patients || 0;
              return active;
            })
            .catch(() => 0);

          const appointmentsPromise = getDoc(doc(db, "organizations", organizationId, "appointments", "_meta"))
            .then(meta => {
              const todayAppts = meta.data()?.today_appointments || 0;
              const completed = meta.data()?.completed_today || 0;
              return { todayAppts, completed };
            })
            .catch(() => ({ todayAppts: 0, completed: 0 }));

          const encountersPromise = getDoc(doc(db, "organizations", organizationId, "encounters", "_meta"))
            .then(meta => {
              const active = meta.data()?.active_encounters || 0;
              return active;
            })
            .catch(() => 0);

          const [patientRes, appointmentRes, encounterRes] = await Promise.all([
            patientPromise,
            appointmentsPromise,
            encountersPromise
          ]);

          patientCount = patientRes.totalPatients ?? patientRes;
          const apptRes = appointmentRes as { todayAppts: number; completed: number };
          todayAppointments = apptRes.todayAppts;
          completedToday = apptRes.completed;
          activeEncounters = encounterRes.activeEncounters ?? encounterRes;
        }

        return {
          totalPatients: patientCount,
          todayAppointments: todayAppointments,
          activeEncounters: activeEncounters,
          completedToday: completedToday,
        };
      } catch (error) {
        console.error("Error loading dashboard summary:", error);
        return {
          totalPatients: 0,
          todayAppointments: 0,
          activeEncounters: 0,
          completedToday: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

function useTodaySchedule() {
  const navigate = useNavigate();
  const db = getFirestore();
  const { currentUser } = useFirebaseAuth();
  
  return useQuery({
    queryKey: ["dashboard", "schedule"],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const appointments = [];
        
        if (currentUser?.uid) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const userData = userDoc.data();
          const organizationId = userData?.organization_id || "org1";
          const clinicId = userData?.clinic_id || "clinic1";

          const appointmentsRef = doc(db, "organizations", organizationId, "appointments", "today");
          const apptsSnapshot = await getDoc(appointmentsRef);
          const apptsData = apptsSnapshot.data();
          
          if (apptsData?.appointments) {
            apptsData.appointments.forEach(appt => {
              if (appt.date === today && appt.status !== 'cancelled' && appt.status !== 'no_show') {
                appointments.push({
                  id: appt.id,
                  time: appt.time || "—",
                  patientName: appt.patient_name || "—",
                  reason: appt.reason || appt.type || "—",
                  status: appt.status,
                });
              }
            });
          }
        }
        
        return appointments;
      } catch (error) {
        console.error("Error loading today schedule:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

function useRecentPatients() {
  const navigate = useNavigate();
  const db = getFirestore();
  const { currentUser } = useFirebaseAuth();
  
  return useQuery({
    queryKey: ["dashboard", "recentPatients"],
    queryFn: async () => {
      try {
        if (currentUser?.uid) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const userData = userDoc.data();
          const organizationId = userData?.organization_id || "org1";
          const clinicId = userData?.clinic_id || "clinic1";

          const patientsRef = doc(db, "organizations", organizationId, "patients", "recent");
          const patientsSnapshot = await getDoc(patientsRef);
          const patientsData = patientsSnapshot.data();
          
          return patientsData?.patients || [];
        }
        
        return [];
      } catch (error) {
        console.error("Error loading recent patients:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const auth = useAuthContext();
  const summary = useDashboardSummary();
  const schedule = useTodaySchedule();
  const recentPatients = useRecentPatients();

  const s = summary.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 text-blue-700';
      case 'confirmed': return 'bg-green-50 text-green-700';
      case 'in_progress': return 'bg-purple-50 text-purple-700';
      case 'completed': return 'bg-emerald-50 text-emerald-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      case 'no_show': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              {getGreeting()}, Dr. {profile?.firstName || (user?.email?.split('@')[0] || "User")}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Here's what's happening in your clinic today.
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                void navigate("/appointments/new");
              }}
              className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white transition-all shadow-sm hover:shadow"
            >
              New Appointment
            </button>
            <button
              onClick={() => {
                void navigate("/appointments");
              }}
              className="border-brand-200 hover:border-brand-300 hover:bg-brand-50 inline-flex items-center gap-2 rounded-lg border bg-white px-5 py-3 text-base font-semibold text-brand-700 transition-all"
            >
              Today's Appointments
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Active Patients</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {summary.isLoading ? "—" : s?.totalPatients}
            </p>
            <p className="mt-1 text-sm text-gray-500">Registered patients</p>
          </div>

          <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Today's Appointments</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {summary.isLoading ? "—" : s?.todayAppointments}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {summary.isLoading ? "—" : `${s?.completedToday} completed`}
            </p>
          </div>

          <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Active Encounters</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {summary.isLoading ? "—" : s?.activeEncounters}
            </p>
            <p className="mt-1 text-sm text-gray-500">Currently in progress</p>
          </div>

          <div className="border-surface-200 rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Upcoming</h3>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {summary.isLoading ? "—" : s?.completedToday}
            </p>
            <p className="mt-1 text-sm text-gray-500">Scheduled for today</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="border-surface-200 rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Today's Appointments</h2>
              <p className="mt-1 text-sm text-gray-500">Your schedule for today</p>

              {schedule.isLoading ? (
                <div className="mt-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex animate-pulse items-center gap-4 rounded-lg bg-gray-50 p-4">
                      <div className="bg-gray-200 h-12 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 w-32 rounded" />
                        <div className="bg-gray-200 h-3 w-24 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : schedule.data && schedule.data.length === 0 ? (
                <div className="mt-8 flex flex-col items-center py-12 text-center">
                  <div className="bg-gray-50 flex h-16 w-16 items-center justify-center rounded-full">
                    <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-base font-bold text-gray-900">No appointments today</p>
                  <p className="mt-1 text-sm text-gray-500">Your schedule is clear</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {schedule.data?.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        void navigate(`/appointments/${a.id}`);
                      }}
                      className="group flex cursor-pointer items-center gap-5 rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:bg-gray-50"
                    >
                      <div className="bg-brand-50 flex h-14 w-20 flex-shrink-0 flex-col items-center justify-center rounded-xl">
                        <span className="text-base font-bold text-brand-700">{a.time}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-gray-900">{a.patientName}</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-gray-600">{a.reason}</p>
                      </div>

                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(a.status)}`}
                        >
                          {a.status}
                        </span>
                      </div>

                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  void navigate("/appointments");
                }}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View all appointments <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-surface-200 rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Recent Patients</h2>
              <p className="mt-1 text-sm text-gray-500">Last 5 patients seen</p>

              {recentPatients.isLoading ? (
                <div className="mt-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex animate-pulse items-center gap-4 rounded-lg bg-gray-50 p-4">
                      <div className="bg-gray-200 h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 h-4 w-24 rounded" />
                        <div className="bg-gray-200 h-3 w-32 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentPatients.data && recentPatients.data.length === 0 ? (
                <div className="mt-8 flex flex-col items-center py-12 text-center">
                  <div className="bg-gray-50 flex h-16 w-16 items-center justify-center rounded-full">
                    <Users className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="mt-4 text-base font-bold text-gray-900">No patients yet</p>
                  <p className="mt-1 text-sm text-gray-500">Patients will appear here after registration</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {recentPatients.data?.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        void navigate(`/patients/${p.id}`);
                      }}
                      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:bg-gray-50"
                    >
                      <div className="bg-brand-50 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                        <span className="text-brand-700 text-base font-bold">
                          {p.first_name?.charAt(0)}{p.last_name?.charAt(0)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-gray-900">
                          {p.first_name} {p.last_name}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-gray-600">
                          MRN: {p.mrn} · {p.age || "—"} years · {p.gender || "—"}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  void navigate("/patients");
                }}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View all patients <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="border-surface-200 rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Quick Clinical Actions</h2>
              <p className="mt-1 text-sm text-gray-500">Common doctor workflows</p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    void navigate("/appointments/new");
                  }}
                  className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-brand-300 hover:bg-brand-50"
                >
                  <div className="bg-brand-50 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                    <Calendar className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900">New Appointment</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-600">Book an appointment for a patient</p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => {
                    void navigate("/patients");
                  }}
                  className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="bg-emerald-50 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900">View Patients</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-600">Search and manage patient records</p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => {
                    void navigate("/encounters");
                  }}
                  classn="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-amber-300 hover:bg-amber-50"
                >
                  <div className="bg-amber-50 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                    <Stethoscope className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900">View Encounters</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-600">View clinical consultations</p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}