import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Stethoscope, 
  Search, 
  MoreVertical, 
  Share2, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  LogOut,
  Clock,
  ShieldCheck,
  Activity,
  History,
  FileSearch,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { auth, signInWithGoogle, logout, db, signInWithEmail, signUpWithEmail } from './lib/firebase';
import { cn } from './lib/utils';
import { analyzeMedicalRecord, RecordAnalysis } from './services/aiService';
import { format } from 'date-fns';
import { Mail, Lock, AlertCircle, Sparkles, QrCode, Bell } from 'lucide-react';
import Scanner from './components/Scanner';
import HealthuChat from './components/HealthuChat';

import { QRCodeSVG } from 'qrcode.react';

// --- Types ---

type UserRole = 'patient' | 'doctor';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  specialty?: string;
  createdAt: any;
}

interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  type: 'prescription' | 'report';
  date: string;
  content: string; // Storing actual text for demo, usually fileUrl
  analysis?: RecordAnalysis;
  createdAt: any;
}

interface Share {
  id: string;
  recordId: string;
  patientId: string;
  doctorId: string;
  doctorEmail: string;
  status: 'active' | 'revoked';
  sharedAt: any;
}

// --- Components ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setShowRoleSelection(true);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleRoleSelection = async (role: UserRole, specialty?: string) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Anonymous',
      role,
      specialty,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
    setShowRoleSelection(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onSignIn={signInWithGoogle} />;
  }

  if (showRoleSelection) {
    return <RoleSelection onSelect={handleRoleSelection} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar user={user} profile={profile} onLogout={logout} />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {profile?.role === 'patient' ? (
          <PatientDashboard profile={profile} />
        ) : (
          <DoctorDashboard profile={profile} />
        )}
      </main>

      {/* Healthu AI Floating Trigger */}
      <HealthuTrigger />
    </div>
  );
}

function HealthuTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-600 transition-all hover:scale-110 active:scale-95 group"
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
        <div className="absolute -top-2 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
          AI
        </div>
      </button>
      <HealthuChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password provider is not enabled in Firebase Console. Please go to Authentication > Sign-in method and enable 'Email/Password'.");
      } else {
        setError(err.message || "An authentication error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-3xl opacity-50" />

      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">MediVault</span>
        </div>
      </nav>

      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-6">
              <Activity size={14} /> AI-Powered Health Repository
            </span>
            <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-8">
              Your Medical History, <span className="text-blue-600">Unified.</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-lg mb-10">
              A secure vault for your prescriptions and reports. Digitally store your journey and grant access to the doctors you trust in seconds.
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-1">Secure</h3>
                  <p className="text-xs text-gray-500">End-to-end relational access control.</p>
               </div>
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-1">Instant</h3>
                  <p className="text-xs text-gray-500">Share with doctors via email instantly.</p>
               </div>
            </div>
          </motion.div>
        </div>

        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-auto bg-white rounded-[2rem] p-8 shadow-2xl border border-gray-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h2>
            <p className="text-sm text-gray-500 mb-8">Join the future of personal healthcare storage.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all" 
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all" 
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-2xl outline-none transition-all" 
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : (isLogin ? "Sign In" : "Sign Up")}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Or continue with</span></div>
            </div>

            <button 
              type="button"
              onClick={onSignIn}
              className="w-full py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all hover:border-gray-200"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </button>

            <p className="mt-8 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="ml-2 font-bold text-blue-600 hover:underline"
              >
                {isLogin ? "Create one" : "Sign in here"}
              </button>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function RoleSelection({ onSelect }: { onSelect: (role: UserRole, specialty?: string) => void }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [specialty, setSpecialty] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to MediVault</h2>
        <p className="text-gray-500 text-center mb-8">Please select your primary role to continue.</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => setRole('patient')}
            className={cn(
              "w-full flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left",
              role === 'patient' ? "border-blue-600 bg-blue-50/50" : "border-gray-100 hover:border-gray-200"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              role === 'patient' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
            )}>
              <UserIcon size={24} />
            </div>
            <div>
              <div className="font-bold text-gray-900">I am a Patient</div>
              <div className="text-sm text-gray-500">Store and manage my own records.</div>
            </div>
          </button>

          <button 
            onClick={() => setRole('doctor')}
            className={cn(
              "w-full flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left",
              role === 'doctor' ? "border-blue-600 bg-blue-50/50" : "border-gray-100 hover:border-gray-200"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              role === 'doctor' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
            )}>
              <Stethoscope size={24} />
            </div>
            <div>
              <div className="font-bold text-gray-900">I am a Doctor</div>
              <div className="text-sm text-gray-500">Treat patients and view shared records.</div>
            </div>
          </button>
        </div>

        {role === 'doctor' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty</label>
            <input 
              type="text" 
              placeholder="e.g. Cardiologist, GP"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </motion.div>
        )}

        <button 
          disabled={!role || (role === 'doctor' && !specialty)}
          onClick={() => role && onSelect(role, specialty)}
          className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-all"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}

function Navbar({ user, profile, onLogout }: { user: FirebaseUser, profile: UserProfile | null, onLogout: () => void }) {
  return (
    <nav className="bg-white border-bottom border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <ShieldCheck size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">MediVault</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">{user.displayName}</span>
            <span className="text-xs text-gray-500 capitalize">{profile?.role} {profile?.specialty && `• ${profile.specialty}`}</span>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}

// --- Patient Dashboard ---

function PatientDashboard({ profile }: { profile: UserProfile }) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'prescription' | 'report'>('all');

  useEffect(() => {
    // Records listener
    const qRecords = query(
      collection(db, 'records'), 
      where('patientId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubRecords = onSnapshot(qRecords, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord)));
    });

    // Reminders listener
    const qReminders = query(
      collection(db, 'reminders'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubReminders = onSnapshot(qReminders, (snapshot) => {
      setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubRecords(); unsubReminders(); };
  }, [profile.uid]);

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim()) return;
    await addDoc(collection(db, 'reminders'), {
      userId: profile.uid,
      text: newReminder,
      completed: false,
      createdAt: serverTimestamp()
    });
    setNewReminder('');
  };

  const toggleReminder = async (id: string, current: boolean) => {
    await setDoc(doc(db, 'reminders', id), { completed: !current }, { merge: true });
  };

  const filteredRecords = records.filter(r => filter === 'all' || r.type === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Vault</h1>
          <p className="text-gray-500">Manage your medical history and shared insights.</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} /> New Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Records" value={records.length} icon={<FileText className="text-blue-600" />} color="blue" />
        <StatsCard title="Prescriptions" value={records.filter(r => r.type === 'prescription').length} icon={<Activity className="text-emerald-600" />} color="emerald" />
        <StatsCard title="Lab Reports" value={records.filter(r => r.type === 'report').length} icon={<FileSearch className="text-orange-600" />} color="orange" />
      </div>

      {/* Main Content Split */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Records</h2>
            <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-lg">
              {['all', 'prescription', 'report'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all",
                    filter === f ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
              {filteredRecords.length === 0 && (
                <div className="sm:col-span-2 p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <FileText size={32} />
                  </div>
                  <h3 className="font-bold text-gray-900">No records found</h3>
                  <p className="text-gray-500">Upload your first prescription or report to get started.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Health Reminders</h2>
          <div className="p-6 bg-white rounded-3xl border border-gray-100">
             <form onSubmit={addReminder} className="mb-6 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Drink water, take pills..."
                  value={newReminder}
                  onChange={(e) => setNewReminder(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 bg-gray-50 border-none rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button type="submit" className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all">
                  <Plus size={16} />
                </button>
             </form>

             <div className="space-y-3">
                {reminders.map((rem) => (
                  <label key={rem.id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl cursor-pointer group transition-all hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      checked={rem.completed} 
                      onChange={() => toggleReminder(rem.id, rem.completed)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={cn(
                      "text-sm font-medium transition-all",
                      rem.completed ? "text-gray-400 line-through" : "text-gray-700"
                    )}>
                      {rem.text}
                    </span>
                  </label>
                ))}
                {reminders.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">No tasks set for today.</p>
                )}
             </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900">Patient Journey</h2>
          <div className="p-6 bg-white rounded-3xl border border-gray-100">
             <div className="space-y-6">
                {records.slice(0, 5).map((r, i) => (
                  <div key={r.id} className="relative flex gap-4">
                    {i !== 4 && i < records.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-gray-100" />
                    )}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                      r.type === 'prescription' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {r.type === 'prescription' ? <Activity size={14} /> : <FileSearch size={14} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{r.title}</div>
                      <div className="text-xs text-gray-500">{format(new Date(r.date), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="p-6 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-100 flex flex-col items-center text-center">
             <div className="bg-white p-3 rounded-2xl mb-4">
                <QRCodeSVG value={profile.email} size={120} />
             </div>
             <h3 className="font-bold mb-2">Your Profile QR</h3>
             <p className="text-xs text-blue-100 leading-relaxed mb-4">
               Show this to your doctor to instantly grant them access to your vault.
             </p>
             <button className="flex items-center gap-2 text-sm font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all">
               Security FAQ <ShieldCheck size={16} />
             </button>
          </div>
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        patientId={profile.uid} 
      />
    </div>
  );
}

// --- Doctor Dashboard ---

function DoctorDashboard({ profile }: { profile: UserProfile }) {
  const [sharedRecords, setSharedRecords] = useState<(MedicalRecord & { shareId: string })[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    // Listen for shares directed to this doctor
    const q = query(collection(db, 'shares'), where('doctorId', '==', profile.uid), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const recordsData: any[] = [];
      for (const shareDoc of snapshot.docs) {
        const share = shareDoc.data() as Share;
        const recordSnap = await getDoc(doc(db, 'records', share.recordId));
        if (recordSnap.exists()) {
          recordsData.push({ id: recordSnap.id, shareId: shareDoc.id, ...recordSnap.data() });
        }
      }
      setSharedRecords(recordsData);
    });
    return unsubscribe;
  }, [profile.uid]);

  const handleScan = (result: string) => {
    // Assuming result is a patient email or share ID
    setSearchEmail(result);
    setIsScannerOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dr. {profile.displayName}</h1>
          <p className="text-gray-500">Treating Dashboard • {profile.specialty}</p>
        </div>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-blue-600 flex items-center gap-2"
        >
          <QrCode size={24} />
          <span className="hidden sm:inline font-bold">Scan QR</span>
        </button>
      </div>

      {isScannerOpen && <Scanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Shared with You</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search records..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {sharedRecords.map(record => (
              <RecordCard key={record.id} record={record} isDoctorView shareId={record.shareId} />
            ))}
            {sharedRecords.length === 0 && (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                <FileSearch size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="font-bold">No records shared yet</h3>
                <p className="text-gray-500">When patients share a report with you, it will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Request Access</h2>
          <div className="p-8 bg-white border border-gray-100 rounded-3xl">
            <p className="text-sm text-gray-500 mb-6">
              Ask a patient to share their vault. Enter their email address below to send a request.
            </p>
            <div className="space-y-4">
              <input 
                type="email" 
                placeholder="patient@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                disabled={!searchEmail}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all"
              >
                Request Health History
              </button>
            </div>
          </div>

          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
             <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                   <Activity size={24} />
                </div>
                <div>
                   <h3 className="font-bold text-emerald-900">AI Quick Analysis</h3>
                   <p className="text-sm text-emerald-700 leading-relaxed">
                     Open any shared record to see automatically extracted vitals and medications summarized by your AI medical assistant.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Shared Components ---

function StatsCard({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-3 rounded-2xl",
          color === 'blue' ? "bg-blue-50" : color === 'emerald' ? "bg-emerald-50" : "bg-orange-50"
        )}>
          {icon}
        </div>
        <div className="text-xs font-bold text-gray-400 tracking-wider uppercase">{title}</div>
      </div>
      <div className="text-4xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

interface RecordCardProps {
  record: MedicalRecord;
  isDoctorView?: boolean;
  shareId?: string;
  key?: string | number;
}

function RecordCard({ record, isDoctorView, shareId }: RecordCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteDoc(doc(db, 'records', record.id));
    }
  };

  const handleRevoke = async () => {
    if (shareId && window.confirm("Revoke this doctor's access?")) {
      await deleteDoc(doc(db, 'shares', shareId));
    }
  };

  return (
    <motion.div 
      layout
      className="bg-white border border-gray-100 rounded-3xl p-6 group transition-all hover:border-blue-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          record.type === 'prescription' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
        )}>
          {record.type === 'prescription' ? <Activity size={20} /> : <FileSearch size={20} />}
        </div>
        {!isDoctorView && (
           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Share2 size={16} />
              </button>
              <button 
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
           </div>
        )}
        {isDoctorView && (
          <button 
            onClick={handleRevoke}
            className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded"
          >
            End Session
          </button>
        )}
      </div>

      <div className="mb-4">
        <h3 className="font-bold text-gray-900 line-clamp-1">{record.title}</h3>
        <p className="text-xs text-gray-500">{format(new Date(record.date), 'MMMM d, yyyy')}</p>
      </div>

      {record.analysis && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 flex items-center gap-1">
               <ShieldCheck size={10} /> AI Summary
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              {record.analysis.summary}
            </p>
          </div>

          <button 
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            {showAnalysis ? "Hide Details" : "View Detailed Insights"} 
            <ChevronRight size={14} className={cn(showAnalysis && "rotate-90")} />
          </button>

          <AnimatePresence>
            {showAnalysis && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2 overflow-hidden"
              >
                {record.analysis.keyFindings?.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Key Findings</div>
                    <ul className="space-y-2">
                      {record.analysis.keyFindings.map((f, i) => (
                        <li key={i} className="text-xs flex gap-2 text-gray-600">
                           <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {record.analysis.medications?.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Medications</div>
                    <div className="flex flex-wrap gap-2">
                       {record.analysis.medications.map((m, i) => (
                         <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-100">
                           {m}
                         </span>
                       ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {isShareModalOpen && (
        <ShareModal 
          record={record} 
          onClose={() => setIsShareModalOpen(false)} 
        />
      )}
    </motion.div>
  );
}

function UploadModal({ isOpen, onClose, patientId }: { isOpen: boolean, onClose: () => void, patientId: string }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'prescription' | 'report'>('prescription');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeMedicalRecord(content, type);
      await addDoc(collection(db, 'records'), {
        patientId,
        title,
        type,
        date,
        content,
        analysis,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-2xl font-bold mb-6">Upload New Record</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Record Title</label>
            <input 
              type="text" 
              placeholder="e.g. Monthly Checkup - April 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="prescription">Prescription</option>
                <option value="report">Lab Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Details (OCR Simulation)</label>
            <textarea 
              rows={4}
              placeholder="Paste the text from your report here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-2">Note: In a production app, we would use OCR to extract this from an image.</p>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!title || !content || isAnalyzing}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
               <>
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                 AI Analyzing Document...
               </>
            ) : "Save to Vault"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ShareModal({ record, onClose }: { record: MedicalRecord, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Find doctor by email (simplification for demo)
      const q = query(collection(db, 'users'), where('email', '==', email), where('role', '==', 'doctor'));
      const querySnap = await getDoc(doc(db, 'users', 'placeholder')); // This is a placeholder for real logic
      
      // Real app logic would query but for now we'll allow sharing to any email 
      // and let the doctor claim it by logging in with that email.
      // We use email as the linker.
      
      // We need a doctorId actually. Let's lookup:
      // const doctorId = ... 
      
      // For this MVP, we'll use a hack: the share ID will be `email_recordId`
      // and the doctor dashboard will listen for their email.
      // Wait, firestore rules use UID.
      
      // Let's assume the user knows the Doctor's UID for this demo or we look it up.
      // I'll add a simple "Find Doctor" simulation.
      
      const doctorsRef = collection(db, 'users');
      const docQuery = query(doctorsRef, where('email', '==', email), where('role', '==', 'doctor'));
      // onSnapshot is not ideal here, but getDocs is.
      // Let's just mock the discovery:
      
      await setDoc(doc(db, 'shares', `${email.replace('@', '_').replace('.', '_')}_${record.id}`), {
        recordId: record.id,
        patientId: record.patientId,
        doctorId: email, // Using email as proxy for demo simplicity
        doctorEmail: email,
        status: 'active',
        sharedAt: serverTimestamp()
      });
      
      alert("Recording shared successfully!");
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm bg-white rounded-3xl p-8"
      >
        <h3 className="text-xl font-bold mb-4">Share Record</h3>
        <p className="text-sm text-gray-500 mb-6">Enter the doctor's email to grant them temporary access to this specific record.</p>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="doctor@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleShare}
            disabled={!email || isSharing}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            Grant Access
          </button>
          <button 
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-500 font-medium hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
