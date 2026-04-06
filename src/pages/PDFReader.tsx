import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Book, ReadingProgress } from '../types';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { ArrowLeft, Moon, Sun, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function PDFReader() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (!id || !user) return;
    setError(null);
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

    const progressId = `${user.uid}_${id}`;
    const unsubProgress = onSnapshot(doc(db, 'reading_progress', progressId), (docSnap) => {
      if (docSnap.exists()) {
        setProgress(docSnap.data() as ReadingProgress);
      }
    }, (error) => {
      console.warn('Reading progress fetch error (non-fatal):', error);
      // Don't throw here to avoid crashing the reader if progress fails
    });

    return () => {
      unsubBook();
      unsubProgress();
    };
  }, [id, user, navigate]);

  const handlePageChange = async (e: { currentPage: number, doc: any }) => {
    setCurrentPage(e.currentPage);
    if (!user || !id) return;
    const progressId = `${user.uid}_${id}`;
    const total = e.doc.numPages;
    setTotalPages(total);
    const progressPercent = (e.currentPage + 1) / total * 100;

    try {
      await setDoc(doc(db, 'reading_progress', progressId), {
        userId: user.uid,
        bookId: id,
        lastPage: e.currentPage,
        progressPercent,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">বইটি লোড হচ্ছে...</div>;
  if (!book) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={`h-16 px-4 flex items-center justify-between border-b z-50 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-500/10 transition-all">
                <ArrowLeft size={24} />
              </button>
              <div className="overflow-hidden">
                <h1 className="font-bold truncate max-w-[150px] md:max-w-md">{book.title}</h1>
                <p className="text-[10px] opacity-60 truncate">{book.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl hover:bg-slate-500/10 transition-all">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="p-2 rounded-xl hover:bg-slate-500/10 transition-all">
                <Bookmark size={20} />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden relative" onClick={() => setShowControls(!showControls)}>
        <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <ArrowLeft size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">বইটি পড়া যাচ্ছে না</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs">
                দুঃখিত, এই PDF ফাইলটি সম্ভবত ত্রুটিযুক্ত বা এটি এই মুহূর্তে লোড করা সম্ভব হচ্ছে না।
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-all"
                >
                  ফিরে যান
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                  আবার চেষ্টা করুন
                </button>
              </div>
            </div>
          ) : (
            <Viewer
              fileUrl={book.pdfUrl}
              plugins={[defaultLayoutPluginInstance]}
              onPageChange={handlePageChange}
              initialPage={progress?.lastPage || 0}
              theme={darkMode ? 'dark' : 'light'}
              onDocumentLoad={(e) => {
                setTotalPages(e.doc.numPages);
                setError(null);
              }}
              onDocumentLoadError={(err) => {
                console.error('PDF Load Error:', err);
                setError(err.message);
              }}
              characterMap={{
                isPacked: true,
                url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
              }}
            />
          )}
        </Worker>
      </div>

      {/* Bottom Progress Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.footer
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`h-12 px-4 flex items-center justify-between border-t z-50 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex-1 flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase w-20">
                পৃষ্ঠা {currentPage + 1} / {totalPages}
              </span>
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress?.progressPercent || 0}%` }}
                  className="h-full bg-indigo-600"
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">
                {Math.round(progress?.progressPercent || 0)}%
              </span>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Security Overlay (Prevent Right Click) */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
