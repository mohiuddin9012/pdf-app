import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Mail, Lock, User as UserIcon, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { user, login, loading, signUpWithEmail, signInWithEmail } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    otp: '',
  });

  if (loading) return <div className="flex items-center justify-center h-screen">লোড হচ্ছে...</div>;
  if (user) return <Navigate to="/" />;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signUpWithEmail(formData.email, formData.password, formData.name);
    } catch (err: any) {
      setError(err.message || 'সাইন আপ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(formData.email, formData.password);
    } catch (err: any) {
      setError('ইমেইল বা পাসওয়ার্ড ভুল।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await login();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('লগইন উইন্ডোটি বন্ধ করা হয়েছে। আবার চেষ্টা করুন।');
      } else {
        setError('গুগল লগইন করতে সমস্যা হয়েছে।');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8 text-center pb-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">স্বাগতম!</h1>
          <p className="text-slate-500 text-sm">
            {tab === 'login' ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </p>
        </div>

        <div className="p-8 pt-4">
          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">ইমেইল</label>
                  <div className="relative group">
                    <div className="input-icon-container with-border group-focus-within:border-indigo-500">
                      <Mail className="group-focus-within:text-indigo-500" size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      className="input-field bg-slate-50/50"
                      placeholder="example@mail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">পাসওয়ার্ড</label>
                  <div className="relative group">
                    <div className="input-icon-container with-border group-focus-within:border-indigo-500">
                      <Lock className="group-focus-within:text-indigo-500" size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      className="input-field bg-slate-50/50"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                {error && <p className="text-rose-500 text-xs font-medium text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white flex items-center justify-center gap-2 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <ArrowRight size={20} />
                      <span>লগইন করুন</span>
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignup}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">আপনার নাম</label>
                  <div className="relative group">
                    <div className="input-icon-container with-border group-focus-within:border-indigo-500">
                      <UserIcon className="group-focus-within:text-indigo-500" size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      className="input-field bg-slate-50/50"
                      placeholder="আপনার নাম লিখুন"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">ইমেইল</label>
                  <div className="relative group">
                    <div className="input-icon-container with-border group-focus-within:border-indigo-500">
                      <Mail className="group-focus-within:text-indigo-500" size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      className="input-field bg-slate-50/50"
                      placeholder="example@mail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">পাসওয়ার্ড</label>
                  <div className="relative group">
                    <div className="input-icon-container with-border group-focus-within:border-indigo-500">
                      <Lock className="group-focus-within:text-indigo-500" size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="input-field bg-slate-50/50"
                      placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                {error && <p className="text-rose-500 text-xs font-medium text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white flex items-center justify-center gap-2 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <span>সাইন আপ করুন</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400 font-medium">অথবা</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-medium transition-all duration-300 hover:bg-slate-50 active:scale-95 shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                <span className="font-bold">গুগল দিয়ে লগইন</span>
              </>
            )}
          </button>

          <div className="mt-8 text-center">
            {tab === 'login' ? (
              <p className="text-sm text-slate-500">
                অ্যাকাউন্ট নেই?{' '}
                <button 
                  onClick={() => { setTab('signup'); setStep('details'); setError(''); }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  নতুন অ্যাকাউন্ট খুলুন
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                আগে থেকেই অ্যাকাউন্ট আছে?{' '}
                <button 
                  onClick={() => { setTab('login'); setStep('details'); setError(''); }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  লগইন করুন
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
