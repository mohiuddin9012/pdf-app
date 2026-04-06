export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  categoryId: string;
  coverImageUrl: string;
  pdfUrl: string;
  storageType: 'cloudinary' | 'drive';
  isFeatured: boolean;
  totalReads: number;
  totalPages: number;
  estimatedReadingTime?: string;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface ReadingProgress {
  userId: string;
  bookId: string;
  lastPage: number;
  progressPercent: number;
  updatedAt: string;
}

export interface Favorite {
  userId: string;
  bookId: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}
