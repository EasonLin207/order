import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { initFirebase, isConfigValid } from '../lib/firebase';
import { MenuItem, Order } from '../types';

interface AppContextType {
  menu: MenuItem[];
  orders: Order[];
  addOrder: (customerName: string, item: MenuItem, notes: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updateMenu: (newItems: MenuItem[]) => Promise<void>;
  loading: boolean;
  firebaseReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data for fallback
const MOCK_MENU: MenuItem[] = [
  { id: '1', name: '炸排骨便當', price: 120, active: true },
  { id: '2', name: '滷肉飯便當', price: 95, active: true },
  { id: '3', name: '香煎雞腿便當', price: 130, active: true },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<MenuItem[]>(MOCK_MENU);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [dbInstance, setDbInstance] = useState<any>(null);

  useEffect(() => {
    let menuUnsub: () => void;
    let ordersUnsub: () => void;

    const start = async () => {
      const { db } = await initFirebase();
      if (db) {
        setDbInstance(db);
        setFirebaseReady(true);

        // Subscribe to Menu
        menuUnsub = onSnapshot(collection(db, 'menu'), (snapshot) => {
          const menuData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
          if (menuData.length > 0) setMenu(menuData);
          setLoading(false);
        });

        // Subscribe to Orders
        const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        ordersUnsub = onSnapshot(ordersQuery, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          setOrders(ordersData);
        });
      } else {
        setLoading(false);
      }
    };
    
    start();

    return () => {
      if (menuUnsub) menuUnsub();
      if (ordersUnsub) ordersUnsub();
    };
  }, []);

  const addOrder = async (customerName: string, item: MenuItem, notes: string) => {
    if (!firebaseReady || !dbInstance) {
      // Mock add
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        customerName,
        notes,
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        status: 'pending',
        createdAt: new Date(),
      };
      setOrders(prev => [newOrder, ...prev]);
      return;
    }

    await addDoc(collection(dbInstance, 'orders'), {
      customerName,
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      notes,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!firebaseReady || !dbInstance) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      return;
    }
    await updateDoc(doc(dbInstance, 'orders', orderId), { status });
  };

  const updateMenu = async (newItems: MenuItem[]) => {
    if (!firebaseReady || !dbInstance) {
      setMenu(newItems);
      return;
    }
    
    for (const item of newItems) {
      const itemRef = doc(collection(dbInstance, 'menu'), item.id || undefined);
      await setDoc(itemRef, {
        name: item.name,
        price: item.price,
        active: true,
      });
    }
  };

  return (
    <AppContext.Provider value={{ menu, orders, addOrder, updateOrderStatus, updateMenu, loading, firebaseReady }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
