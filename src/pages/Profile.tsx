import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Mail, Shield, Settings, HelpCircle, Info, ChevronRight, Bell, Moon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const menuItems = [
    { icon: <Settings size={20} />, label: 'অ্যাকাউন্ট সেটিংস', color: 'text-slate-600' },
    { icon: <Bell size={20} />, label: 'নোটিফিকেশন', color: 'text-slate-600' },
    { icon: <Moon size={20} />, label: 'ডার্ক মোড', color: 'text-slate-600', toggle: true },
    { icon: <HelpCircle size={20} />, label: 'সাহায্য ও সাপোর্ট', color: 'text-slate-600' },
    { icon: <Info size={20} />, label: 'আমাদের সম্পর্কে', color: 'text-slate-600' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">প্রোফাইল</h1>
        <p className="text-slate-500">আপনার অ্যাকাউন্ট এবং সেটিংস পরিচালনা করুন</p>
      </header>

      {/* Profile Card */}
      <section className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200">
        <div className="flex items-center gap-6 relative z-10">
          <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-lg" />
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{user.displayName}</h2>
            <div className="flex items-center gap-2 text-indigo-100 text-sm">
              <Mail size={14} />
              <span>{user.email}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm mt-2">
              <Shield size={12} />
              <span>{user.role === 'admin' ? 'অ্যাডমিন' : 'ব্যবহারকারী'}</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </section>

      {/* Menu List */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {menuItems.map((item, i) => (
            <button 
              key={i} 
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center ${item.color} group-hover:bg-white transition-all`}>
                  {item.icon}
                </div>
                <span className="font-bold text-slate-700">{item.label}</span>
              </div>
              {item.toggle ? (
                <div className="w-10 h-6 bg-slate-200 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                </div>
              ) : (
                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Logout Button */}
      <button 
        onClick={logout}
        className="w-full flex items-center justify-center gap-3 bg-rose-50 text-rose-600 py-4 rounded-2xl font-bold transition-all hover:bg-rose-100 active:scale-95"
      >
        <LogOut size={20} />
        <span>লগ আউট করুন</span>
      </button>

      <div className="text-center space-y-1">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">বইঘর v1.0.0</p>
        <p className="text-[10px] text-slate-300">Made with ❤️ for Bangla Readers</p>
      </div>
    </div>
  );
}
