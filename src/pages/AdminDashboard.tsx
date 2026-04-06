import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Book, Category } from '../types';
import { Plus, Edit, Trash2, BookOpen, Users, Grid, TrendingUp, Search, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const unsubBooks = onSnapshot(query(collection(db, 'books'), orderBy('createdAt', 'desc')), (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books');
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => {
      unsubBooks();
      unsubCategories();
    };
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleDelete = async () => {
    if (!deleteConfirmId || !user || user.role !== 'admin') return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'books', deleteConfirmId));
      setFeedback({ type: 'success', message: 'বইটি সফলভাবে মুছে ফেলা হয়েছে।' });
      setDeleteConfirmId(null);
    } catch (error: any) {
      console.error('Error deleting book:', error);
      setFeedback({ type: 'error', message: 'বইটি মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'মোট বই', value: books.length, icon: <BookOpen />, color: 'bg-indigo-500' },
    { label: 'ক্যাটাগরি', value: categories.length, icon: <Grid />, color: 'bg-emerald-500' },
    { label: 'মোট পাঠক', value: '১.২কে', icon: <Users />, color: 'bg-amber-500' },
    { label: 'পড়া হয়েছে', value: books.reduce((acc, b) => acc + (b.totalReads || 0), 0), icon: <TrendingUp />, color: 'bg-rose-500' },
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle size={48} className="text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">অ্যাক্সেস নেই</h2>
        <p className="text-slate-500">এই পেজটি দেখার অনুমতি আপনার নেই।</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Feedback Messages */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-4 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl ${
              feedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="ml-2 p-1 hover:bg-white/20 rounded-full">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-slate-500">বই এবং লাইব্রেরি পরিচালনা করুন</p>
        </div>
        <Link to="/admin/upload" className="btn-primary flex items-center gap-2 py-3 px-6 rounded-2xl shadow-lg shadow-indigo-200">
          <Plus size={20} />
          নতুন বই যোগ করুন
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3"
          >
            <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Books Table */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">বইয়ের তালিকা</h2>
          <div className="relative w-full md:w-64 group">
            <div className="input-icon-container group-focus-within:text-indigo-500">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="খুঁজুন..." 
              className="input-field py-2 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">বইয়ের নাম</th>
                <th className="px-6 py-4">লেখক</th>
                <th className="px-6 py-4">ক্যাটাগরি</th>
                <th className="px-6 py-4">পড়া হয়েছে</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={book.coverImageUrl} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                      <span className="font-bold text-slate-700 line-clamp-1">{book.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{book.author}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase">উপন্যাস</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{book.totalReads || 0} বার</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/edit/${book.id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => setDeleteConfirmId(book.id)} 
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">আপনি কি নিশ্চিত?</h3>
                <p className="text-slate-500">এই বইটি মুছে ফেললে তা আর ফিরে পাওয়া যাবে না।</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                >
                  না, থাক
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : 'হ্যাঁ, মুছুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
