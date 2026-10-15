import { AnimatePresence, motion } from 'framer-motion';
import { Home, RotateCcw, UserRound, Video } from 'lucide-react';
import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { toast, Toaster } from '@/components/ui';
import { useGame } from '@/game';
import { RenderScene } from '@/player';
import { DebriefScreen } from '@/screens/DebriefScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { IncidentScreen } from '@/screens/IncidentScreen';
import { LabScreen } from '@/screens/LabScreen';
import { LessonScreen } from '@/screens/LessonScreen';
import { LevelHubScreen } from '@/screens/LevelHubScreen';
import { MiniGameScreen } from '@/screens/MiniGameScreen';
import { MissionScreen } from '@/screens/MissionScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { QuizScreen } from '@/screens/QuizScreen';
import { ReviewScreen } from '@/screens/ReviewScreen';
import { VideosScreen } from '@/screens/VideosScreen';

const NAV = [
  { to: '/', label: 'HQ', icon: Home, end: true },
  { to: '/profile', label: 'Profile', icon: UserRound, end: false },
  { to: '/review', label: 'Flashback', icon: RotateCcw, end: false },
  { to: '/videos', label: 'Videos', icon: Video, end: false },
];

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
        <NavLink to="/" className="mr-2 flex items-center gap-2 font-black tracking-tight text-slate-50">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.35)]">
            <Home size={15} />
          </span>
          <span className="hidden sm:inline">PixelPost HQ</span>
        </NavLink>
        <nav className="ml-auto flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Layout() {
  const location = useLocation();
  useEffect(() => useGame.subscribe((state, previous) => {
    const gained = state.xp - previous.xp;
    if (gained > 0) toast(`+${gained} XP`, { icon: 'sparkles', tone: 'xp' });
  }), []);
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/level/:id" element={<LevelHubScreen />} />
        <Route path="/level/:id/incident" element={<IncidentScreen />} />
        <Route path="/level/:id/lesson" element={<LessonScreen />} />
        <Route path="/level/:id/lab" element={<LabScreen />} />
        <Route path="/level/:id/minigame/:mg" element={<MiniGameScreen />} />
        <Route path="/level/:id/mission" element={<MissionScreen />} />
        <Route path="/level/:id/quiz" element={<QuizScreen />} />
        <Route path="/level/:id/debrief" element={<DebriefScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/videos" element={<VideosScreen />} />
      </Route>
      <Route path="/render/:levelId" element={<RenderScene />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
