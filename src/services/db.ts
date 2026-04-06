import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Book, Category, User } from '../types';

export const dbService = {
  // Books
  async getBooks(limitCount = 10) {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
  },

  async getBookById(id: string) {
    const docSnap = await getDoc(doc(db, 'books', id));
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Book) : null;
  },

  async addBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'totalReads'>) {
    return await addDoc(collection(db, 'books'), {
      ...book,
      totalReads: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async updateBook(id: string, book: Partial<Book>) {
    return await updateDoc(doc(db, 'books', id), {
      ...book,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteBook(id: string) {
    return await deleteDoc(doc(db, 'books', id));
  },

  async incrementReadCount(id: string) {
    return await updateDoc(doc(db, 'books', id), {
      totalReads: increment(1),
    });
  },

  // Categories
  async getCategories() {
    const snapshot = await getDocs(collection(db, 'categories'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  },

  async addCategory(category: Omit<Category, 'id'>) {
    return await addDoc(collection(db, 'categories'), category);
  },

  // Users
  async getUserProfile(uid: string) {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? (docSnap.data() as User) : null;
  }
};
