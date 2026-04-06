import { Link } from 'react-router-dom';
import { Book } from '../types';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

export default function BookCard({ book }: { book: Book, key?: string }) {
  return (
    <Link to={`/book/${book.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="premium-card p-3 flex flex-col h-full bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 shadow-sm">
          <img 
            src={book.coverImageUrl} 
            alt={book.title} 
            className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold text-amber-500 shadow-sm">
            <Star size={10} fill="currentColor" />
            <span>{book.averageRating ? book.averageRating.toFixed(1) : '০.০'}</span>
          </div>
        </div>
        
        <div className="flex-1 px-1">
          <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight mb-1">{book.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-1">{book.author}</p>
        </div>
        
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
            {book.storageType === 'cloudinary' ? 'Cloudinary' : 'Drive'}
          </span>
          <span className="text-[10px] text-slate-400">{book.totalReads || 0} বার পড়া হয়েছে</span>
        </div>
      </motion.div>
    </Link>
  );
}
