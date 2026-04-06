import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, setDoc, deleteDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Book, Favorite, Rating } from '../types';
import { ArrowLeft, BookOpen, Heart, Share2, Star, Clock, User, Grid, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubBook = onSnapshot(doc(db, 'books', id), (docSnap) => {
      if (docSnap.exists()) {
        setBook({ id: docSnap.id, ...docSnap.data() } as Book);
      } else {
        navigate('/');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `books/${id}`);
    });

    let unsubFavorite = () => {};
    let unsubRating = () => {};

    if (user) {
      const favoriteId = `${user.uid}_${id}`;
      unsubFavorite = onSnapshot(doc(db, 'favorites', favoriteId), (docSnap) => {
        setIsFavorite(docSnap.exists());
      }, (error) => {
        console.warn('Favorites fetch error (non-fatal):', error);
      });

      const ratingId = `${user.uid}_${id}`;
      unsubRating = onSnapshot(doc(db, 'ratings', ratingId), (docSnap) => {
        if (docSnap.exists()) {
          setUserRating(docSnap.data().rating);
        }
      });
    }

    return () => {
      unsubBook();
      unsubFavorite();
      unsubRating();
    };
  }, [id, user, navigate]);

  const toggleFavorite = async () => {
    if (!user || !id) return;
    const favoriteId = `${user.uid}_${id}`;
    if (isFavorite) {
      await deleteDoc(doc(db, 'favorites', favoriteId));
    } else {
      await setDoc(doc(db, 'favorites', favoriteId), {
        userId: user.uid,
        bookId: id,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleRead = async () => {
    if (!id) return;
    await updateDoc(doc(db, 'books', id), {
      totalReads: increment(1),
    });
    navigate(`/read/${id}`);
  };

  const handleRate = async (rating: number) => {
    if (!user || !id || !book || isRating) return;
    setIsRating(true);
    const ratingId = `${user.uid}_${id}`;

    try {
      const oldRating = userRating;
      await setDoc(doc(db, 'ratings', ratingId), {
        userId: user.uid,
        bookId: id,
        rating,
        updatedAt: new Date().toISOString(),
      });

      // Update book aggregate
      let newTotalRatings = book.totalRatings || 0;
      let newAverageRating = book.averageRating || 0;

      if (oldRating === 0) {
        // New rating
        const totalSum = (newAverageRating * newTotalRatings) + rating;
        newTotalRatings += 1;
        newAverageRating = totalSum / newTotalRatings;
      } else {
        // Update existing rating
        const totalSum = (newAverageRating * newTotalRatings) - oldRating + rating;
        newAverageRating = totalSum / newTotalRatings;
      }

      await updateDoc(doc(db, 'books', id), {
        averageRating: parseFloat(newAverageRating.toFixed(1)),
        totalRatings: newTotalRatings,
      });

      setUserRating(rating);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsRating(false);
    }
  };

  const formatReadingTime = (pages: number) => {
    if (!pages) return null;
    const totalMinutes = pages * 1.5; // 1.5 min per page
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours > 0) {
      return `আনুমানিক ${hours} ঘণ্টা ${minutes} মিনিট`;
    }
    return `আনুমানিক ${minutes} মিনিট`;
  };

  if (loading) return <div className="flex items-center justify-center h-screen">লোড হচ্ছে...</div>;
  if (!book) return null;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm transition-all hover:bg-slate-50">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button onClick={toggleFavorite} className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm transition-all hover:bg-slate-50 ${isFavorite ? 'text-rose-500' : 'text-slate-400'}`}>
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm transition-all hover:bg-slate-50">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Book Info */}
      <div className="flex flex-col md:flex-row gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full md:w-64 aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100 border-4 border-white"
        >
          <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </motion.div>

        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">{book.title}</h1>
            <div className="flex items-center gap-2 text-slate-500">
              <User size={16} />
              <p className="text-lg font-medium">{book.author}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1 shadow-sm">
              <Star size={18} className="text-amber-500" fill="currentColor" />
              <span className="text-sm font-bold">
                {book.averageRating ? book.averageRating.toFixed(1) : '০.০'}
              </span>
              <span className="text-[10px] text-slate-400">রেটিং ({book.totalRatings || 0})</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1 shadow-sm">
              <BookOpen size={18} className="text-indigo-500" />
              <span className="text-sm font-bold">{book.totalPages || '০'}</span>
              <span className="text-[10px] text-slate-400">পৃষ্ঠা</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1 shadow-sm">
              <Clock size={18} className="text-emerald-500" />
              <span className="text-sm font-bold text-center leading-tight">
                {book.estimatedReadingTime || (book.totalPages ? `${Math.round(book.totalPages * 1.5)} মি.` : 'N/A')}
              </span>
              <span className="text-[10px] text-slate-400">পড়ার সময়</span>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">আপনার রেটিং দিন</h4>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  disabled={isRating}
                  onClick={() => handleRate(star)}
                  className={`transition-all ${isRating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-90'}`}
                >
                  <Star 
                    size={28} 
                    className={star <= userRating ? 'text-amber-500' : 'text-slate-300'} 
                    fill={star <= userRating ? 'currentColor' : 'none'} 
                  />
                </button>
              ))}
              {isRating && <Loader2 size={16} className="animate-spin text-indigo-600 ml-2" />}
            </div>
            <p className="text-[10px] text-indigo-600 font-medium">
              {userRating > 0 ? `আপনি ${userRating} স্টার দিয়েছেন` : 'রেটিং দিতে স্টার সিলেক্ট করুন'}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Grid size={18} className="text-indigo-600" />
              বইয়ের বিবরণ
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {book.description || 'এই বইটির কোনো সংক্ষিপ্ত বিবরণ পাওয়া যায়নি। তবে এটি একটি চমৎকার বই হতে পারে আপনার পড়ার তালিকায়।'}
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={handleRead} className="flex-1 btn-primary flex items-center justify-center gap-2 py-4 rounded-2xl shadow-lg shadow-indigo-200">
              <BookOpen size={20} />
              পড়া শুরু করুন
            </button>
          </div>
        </div>
      </div>

      {/* More Info Section */}
      <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900">বইয়ের তথ্য</h3>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">ক্যাটাগরি</span>
            <span className="font-medium text-slate-700">উপন্যাস</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">ভাষা</span>
            <span className="font-medium text-slate-700">বাংলা</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">আনুমানিক পড়ার সময়</span>
            <span className="font-medium text-slate-700">
              {book.estimatedReadingTime || formatReadingTime(book.totalPages) || 'অজানা'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">মোট পৃষ্ঠা</span>
            <span className="font-medium text-slate-700">{book.totalPages || 'অজানা'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">স্টোরেজ</span>
            <span className="font-medium text-slate-700 capitalize">{book.storageType}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
