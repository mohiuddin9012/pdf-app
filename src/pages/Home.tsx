import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Book, Category } from '../types';
import BookCard from '../components/BookCard';
import { Search, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const booksQuery = query(collection(db, 'books'), orderBy('createdAt', 'desc'), limit(10));
    const featuredQuery = query(collection(db, 'books'), where('isFeatured', '==', true), limit(5));
    const categoriesQuery = query(collection(db, 'categories'), limit(8));

    const unsubBooks = onSnapshot(booksQuery, (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books');
    });

    const unsubFeatured = onSnapshot(featuredQuery, (snapshot) => {
      setFeaturedBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books/featured');
    });

    const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => {
      unsubBooks();
      unsubFeatured();
      unsubCategories();
    };
  }, []);

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        {/* Header Banner */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1e40af] to-[#6d28d9] rounded-[2rem] p-6 md:p-10 text-white shadow-xl shadow-indigo-200/20 min-h-[140px] md:min-h-[200px] flex items-center">
          <div className="relative z-10 w-full">
            <h1 className="text-xl md:text-4xl font-extrabold leading-tight tracking-tight max-w-[200px] md:max-w-xl">
              আপনার প্রিয় বইগুলো এখন আপনার হাতের মুঠোয়
            </h1>
            <p className="text-xs md:text-lg text-blue-100/80 font-light mt-2 md:mt-3">
              আজ আপনি কোন বইটি পড়তে চান?
            </p>
          </div>
          
          {/* Background Decorative Icon - Noticeable bottom-right, upright */}
          <div className="absolute right-2 bottom-0 opacity-15 pointer-events-none">
            <BookOpen size={80} strokeWidth={1} className="md:w-[140px] md:h-[140px]" />
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative group">
          <div className="input-icon-container group-focus-within:text-indigo-500">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="বই বা লেখকের নাম দিয়ে খুঁজুন..."
            className="input-field py-4 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Featured Books Slider */}
      {featuredBooks.length > 0 && !searchQuery && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} />
              <h2 className="text-xl font-bold text-slate-900">সেরা সংগ্রহ</h2>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {featuredBooks.map((book) => (
              <Link 
                key={book.id} 
                to={`/book/${book.id}`}
                className="min-w-[280px] h-40 bg-indigo-600 rounded-3xl p-6 flex gap-4 text-white snap-start relative overflow-hidden group shadow-lg shadow-indigo-200"
              >
                <div className="flex-1 z-10">
                  <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{book.title}</h3>
                  <p className="text-indigo-100 text-sm mb-4">{book.author}</p>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">এখনই পড়ুন</span>
                </div>
                <img 
                  src={book.coverImageUrl} 
                  alt={book.title} 
                  className="w-24 h-32 object-cover rounded-lg shadow-xl z-10 transform group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">ক্যাটাগরি</h2>
          <Link to="/categories" className="text-indigo-600 text-sm font-medium flex items-center gap-1">
            সব দেখুন <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/categories?id=${cat.id}`}
              className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 transition-all hover:border-indigo-200 hover:bg-indigo-50/30 group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                {cat.icon || '📚'}
              </div>
              <span className="text-xs font-medium text-slate-600 text-center line-clamp-1">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Added */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">নতুন বই</h2>
          <Link to="/library" className="text-indigo-600 text-sm font-medium flex items-center gap-1">
            সব দেখুন <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
