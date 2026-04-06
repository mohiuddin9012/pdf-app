import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, Library, User, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: <Home size={24} />, label: 'হোম', path: '/' },
    { icon: <Grid size={24} />, label: 'ক্যাটাগরি', path: '/categories' },
    { icon: <Library size={24} />, label: 'লাইব্রেরি', path: '/library' },
    { icon: <User size={24} />, label: 'প্রোফাইল', path: '/profile' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ icon: <Shield size={24} />, label: 'অ্যাডমিন', path: '/admin' });
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-64">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 p-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">বইঘর</h1>
          <p className="text-xs text-slate-400 mt-1">আপনার প্রিয় বইয়ের সংগ্রহ</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-slate-500 hover:bg-slate-50'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="mt-auto pt-6 border-t border-slate-100 flex items-center gap-3">
            <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border border-slate-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-100 px-4 py-3 flex justify-around items-center z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`
            }
          >
            <motion.div whileTap={{ scale: 0.8 }}>{item.icon}</motion.div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
