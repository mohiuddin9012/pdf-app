import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Book, Favorite, ReadingProgress } from '../types';
import BookCard from '../components/BookCard';
import { Heart, Clock, Library as LibraryIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Library() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [readingProgress, setReadingProgress] = useState<(Book & { progress: ReadingProgress })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'reading'>('favorites');

  useEffect(() => {
    if (!user) return;

    // Fetch Favorites
    const unsubFavorites = onSnapshot(query(collection(db, 'favorites'), where('userId', '==', user.uid)), async (snapshot) => {
      const bookIds = snapshot.docs.map(doc => (doc.data() as Favorite).bookId);
      if (bookIds.length > 0) {
        const unsubBooks = onSnapshot(query(collection(db, 'books'), where('__name__', 'in', bookIds)), (bookSnap) => {
          setFavorites(bookSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
          setLoading(false);
        }, (error) => {
          console.warn('Books fetch error (non-fatal):', error);
        });
        return () => unsubBooks();
      } else {
        setFavorites([]);
        setLoading(false);
      }
    }, (error) => {
      console.warn('Favorites fetch error (non-fatal):', error);
      setLoading(false);
    });

    // Fetch Reading Progress
    const unsubProgress = onSnapshot(query(collection(db, 'reading_progress'), where('userId', '==', user.uid), orderBy('updatedAt', 'desc')), async (snapshot) => {
      const progressData = snapshot.docs.map(doc => doc.data() as ReadingProgress);
      const bookIds = progressData.map(p => p.bookId);
      
      if (bookIds.length > 0) {
        const unsubBooks = onSnapshot(query(collection(db, 'books'), where('__name__', 'in', bookIds)), (bookSnap) => {
          const books = bookSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
          const combined = progressData.map(p => {
            const book = books.find(b => b.id === p.bookId);
            return book ? { ...book, progress: p } : null;
          }).filter(Boolean) as (Book & { progress: ReadingProgress })[];
          setReadingProgress(combined);
        }, (error) => {
          console.warn('Books fetch error (non-fatal):', error);
        });
        return () => unsubBooks();
      } else {
        setReadingProgress([]);
      }
    }, (error) => {
      console.warn('Reading progress fetch error (non-fatal):', error);
    });

    return () => {
      unsubFavorites();
      unsubProgress();
    };
  }, [user]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">আমার লাইব্রেরি</h1>
        <p className="text-slate-500">আপনার সংরক্ষিত এবং পড়া বইগুলো এখানে পাবেন</p>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'favorites' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <Heart size={18} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} />
          <span>প্রিয় বই</span>
        </button>
        <button
          onClick={() => setActiveTab('reading')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'reading' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          <Clock size={18} />
          <span>পড়া হচ্ছে</span>
        </button>
      </div>

      {/* Content */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : activeTab === 'favorites' ? (
          favorites.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {favorites.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Heart size={40} />} message="আপনার প্রিয় কোনো বই এখনো যোগ করা হয়নি।" />
          )
        ) : (
          readingProgress.length > 0 ? (
            <div className="space-y-4">
              {readingProgress.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/book/${item.id}`}
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-center transition-all hover:border-indigo-200"
                >
                  <img src={item.coverImageUrl} alt={item.title} className="w-16 h-24 object-cover rounded-xl shadow-sm" />
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <h3 className="font-bold text-slate-900 truncate">{item.title}</h3>
                    <p className="text-xs text-slate-500 truncate">{item.author}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>পড়া হয়েছে</span>
                        <span>{Math.round(item.progress.progressPercent)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${item.progress.progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ArrowRight size={20} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Clock size={40} />} message="আপনি এখনো কোনো বই পড়া শুরু করেননি।" />
          )
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
        {icon}
      </div>
      <p className="text-slate-500 font-medium max-w-[200px] mx-auto leading-relaxed">{message}</p>
    </div>
  );
}
