import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Book, Category } from '../types';
import BookCard from '../components/BookCard';
import { Grid, Search, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Categories() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('id');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId);

  useEffect(() => {
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => unsubCategories();
  }, []);

  useEffect(() => {
    let booksQuery = query(collection(db, 'books'));
    if (selectedCategory) {
      booksQuery = query(collection(db, 'books'), where('categoryId', '==', selectedCategory));
    }

    const unsubBooks = onSnapshot(booksQuery, (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `books/category/${selectedCategory || 'all'}`);
    });

    return () => unsubBooks();
  }, [selectedCategory]);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm transition-all hover:bg-slate-50">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ক্যাটাগরি</h1>
          <p className="text-sm text-slate-500">আপনার পছন্দের বিষয় অনুযায়ী বই খুঁজুন</p>
        </div>
      </header>

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap shadow-sm ${
            !selectedCategory ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-100'
          }`}
        >
          সব বই
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap shadow-sm flex items-center gap-2 ${
              selectedCategory === cat.id ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-100'
            }`}
          >
            <span>{cat.icon || '📚'}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Books Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search size={40} />
            </div>
            <p className="text-slate-500 font-medium">এই ক্যাটাগরিতে কোনো বই পাওয়া যায়নি।</p>
          </div>
        )}
      </section>
    </div>
  );
}
