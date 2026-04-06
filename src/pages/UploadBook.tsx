import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { ArrowLeft, Upload, Image as ImageIcon, FileText, CheckCircle2, Loader2, AlertCircle, BookOpen, User as UserIcon, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path to match package.json version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function UploadBook() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    categoryId: '',
    coverImageUrl: '',
    pdfUrl: '',
    isFeatured: false,
    storageType: 'cloudinary' as 'cloudinary' | 'drive',
    totalPages: 0,
    estimatedReadingTime: '',
    averageRating: 0,
    totalRatings: 0,
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (pdfFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
          const loadingTask = pdfjsLib.getDocument({
            data: typedarray,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
          });
          const pdf = await loadingTask.promise;
          const pages = pdf.numPages;
          
          // Auto-calculate reading time (1.5 min per page)
          const totalMinutes = pages * 1.5;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.round(totalMinutes % 60);
          let timeStr = '';
          if (hours > 0) {
            timeStr = `${hours} ঘণ্টা ${minutes} মিনিট`;
          } else {
            timeStr = `${minutes} মিনিট`;
          }

          setFormData(prev => ({ 
            ...prev, 
            totalPages: pages,
            estimatedReadingTime: timeStr
          }));
        } catch (err) {
          console.error('Error reading PDF pages:', err);
        }
      };
      reader.readAsArrayBuffer(pdfFile);
    }
  }, [pdfFile]);

  useEffect(() => {
    if (id) {
      const fetchBook = async () => {
        const docSnap = await getDoc(doc(db, 'books', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({
            ...prev,
            ...data,
            title: data.title || '',
            author: data.author || '',
            description: data.description || '',
            categoryId: data.categoryId || '',
            coverImageUrl: data.coverImageUrl || '',
            pdfUrl: data.pdfUrl || '',
            estimatedReadingTime: data.estimatedReadingTime || '',
            totalPages: data.totalPages || 0,
          }));
        }
      };
      fetchBook();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    // Client-side validation for Cloudinary limits (10MB for raw files on free tier)
    if (pdfFile && pdfFile.size > 10485760) {
      setError('PDF ফাইলের সাইজ ১০ মেগাবাইটের (10MB) বেশি হতে পারবে না। অনুগ্রহ করে ফাইলটি ছোট করুন বা অন্য কোনো ফাইল ব্যবহার করুন।');
      return;
    }

    if (coverFile && coverFile.size > 10485760) {
      setError('কভার ইমেজের সাইজ ১০ মেগাবাইটের (10MB) বেশি হতে পারবে না।');
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      let coverUrl = formData.coverImageUrl;
      let pdfUrl = formData.pdfUrl;

      if (coverFile) {
        coverUrl = await uploadToCloudinary(coverFile, 'image');
      }

      if (pdfFile) {
        pdfUrl = await uploadToCloudinary(pdfFile, 'raw');
      }

      const bookData = {
        ...formData,
        coverImageUrl: coverUrl,
        pdfUrl: pdfUrl,
        updatedAt: new Date().toISOString(),
      };

      if (id) {
        await updateDoc(doc(db, 'books', id), bookData);
      } else {
        await addDoc(collection(db, 'books'), {
          ...bookData,
          totalReads: 0,
          createdAt: serverTimestamp(),
        });
      }

      navigate('/admin');
    } catch (error: any) {
      console.error('Error uploading book:', error);
      setError(`বই আপলোড করতে সমস্যা হয়েছে: ${error.message}`);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm transition-all hover:bg-slate-50">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{id ? 'বই এডিট করুন' : 'নতুন বই যোগ করুন'}</h1>
          <p className="text-sm text-slate-500">বইয়ের সব তথ্য সঠিকভাবে পূরণ করুন</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">বইয়ের নাম</label>
              <div className="relative group">
                <div className="input-icon-container group-focus-within:text-indigo-500">
                  <BookOpen size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  className="input-field" 
                  placeholder="বইয়ের নাম লিখুন"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">লেখকের নাম</label>
              <div className="relative group">
                <div className="input-icon-container group-focus-within:text-indigo-500">
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  className="input-field" 
                  placeholder="লেখকের নাম লিখুন"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">বইয়ের বিবরণ</label>
            <div className="relative group">
              <div className="input-icon-container top-6 group-focus-within:text-indigo-500">
                <FileText size={18} />
              </div>
              <input 
                type="hidden" 
                className="hidden" 
              />
              <textarea 
                rows={4}
                className="input-field resize-none" 
                placeholder="বই সম্পর্কে কিছু লিখুন..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">কভার ইমেজ (JPG/PNG)</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  id="cover-upload"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="cover-upload"
                  className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  {coverFile ? <CheckCircle2 size={20} className="text-emerald-500" /> : <ImageIcon size={20} className="text-slate-400" />}
                  <span className="text-sm font-medium text-slate-600">{coverFile ? coverFile.name : 'কভার ইমেজ সিলেক্ট করুন'}</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">PDF ফাইল</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="hidden" 
                  id="pdf-upload"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="pdf-upload"
                  className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  {pdfFile ? <CheckCircle2 size={20} className="text-emerald-500" /> : <FileText size={20} className="text-slate-400" />}
                  <span className="text-sm font-medium text-slate-600">{pdfFile ? pdfFile.name : 'PDF ফাইল সিলেক্ট করুন'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">মোট পৃষ্ঠা সংখ্যা</label>
              <div className="relative group">
                <div className="input-icon-container group-focus-within:text-indigo-500">
                  <FileText size={18} />
                </div>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="পৃষ্ঠা সংখ্যা লিখুন"
                  value={formData.totalPages || ''}
                  onChange={(e) => setFormData({ ...formData, totalPages: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">পড়ার আনুমানিক সময় (যেমন: ২ ঘণ্টা ৩০ মিনিট)</label>
              <div className="relative group">
                <div className="input-icon-container group-focus-within:text-indigo-500">
                  <Clock size={18} />
                </div>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="সময় লিখুন"
                  value={formData.estimatedReadingTime}
                  onChange={(e) => setFormData({ ...formData, estimatedReadingTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <input 
              type="checkbox" 
              id="featured"
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            />
            <label htmlFor="featured" className="text-sm font-bold text-slate-700 cursor-pointer">সেরা সংগ্রহ হিসেবে দেখান (Featured)</label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-3 py-4 rounded-2xl shadow-xl shadow-indigo-200 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>{uploading ? 'ফাইল আপলোড হচ্ছে...' : 'সেভ হচ্ছে...'}</span>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span>বইটি সেভ করুন</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
