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
  deleteDoc,
  getDocs,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { initFirebase } from '../lib/firebase';
import { MenuItem, Order, Restaurant } from '../types';
import toast from 'react-hot-toast';

interface AppContextType {
  restaurants: Restaurant[];
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (id: string | null) => void;
  menu: MenuItem[];
  orders: Order[];
  addOrder: (customerName: string, notes: string, cart: { item: MenuItem, quantity: number }[]) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updateMenu: (restaurantId: string, newItems: MenuItem[]) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addRestaurant: (name: string) => Promise<void>;
  deleteRestaurant: (id: string) => Promise<void>;
  resetTodayOrders: (restaurantId: string) => Promise<void>;
  loading: boolean;
  firebaseReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [dbInstance, setDbInstance] = useState<any>(null);

  useEffect(() => {
    let restaurantUnsub: () => void;
    let menuUnsub: () => void;
    let ordersUnsub: () => void;

    const start = async () => {
      const { db } = await initFirebase();
      if (db) {
        setDbInstance(db);
        setFirebaseReady(true);

        // Subscribe to Restaurants
        restaurantUnsub = onSnapshot(collection(db, 'restaurants'), { includeMetadataChanges: true }, (snapshot) => {
          const restaurantData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
          setRestaurants(restaurantData);
          if (restaurantData.length > 0 && !selectedRestaurantId) {
            // Don't auto-set here to avoid loop, let the UI handle it or use a separate ref
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    };
    
    start();

    return () => {
      if (restaurantUnsub) restaurantUnsub();
      if (menuUnsub) menuUnsub();
      if (ordersUnsub) ordersUnsub();
    };
  }, []);

  // Effect to subscribe to menu and orders when selectedRestaurantId changes
  useEffect(() => {
    let menuUnsub: () => void;
    let ordersUnsub: () => void;

    if (dbInstance && selectedRestaurantId) {
      // Subscribe to Menu for selected restaurant
      const menuQuery = query(collection(dbInstance, 'menu'), where('restaurantId', '==', selectedRestaurantId));
      menuUnsub = onSnapshot(menuQuery, { includeMetadataChanges: true }, (snapshot) => {
        const menuData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenu(menuData);
      });

      // Subscribe to Orders for selected restaurant
      const ordersQuery = query(
        collection(dbInstance, 'orders'), 
        where('restaurantId', '==', selectedRestaurantId)
      );
      ordersUnsub = onSnapshot(ordersQuery, { includeMetadataChanges: true }, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        // Sort client-side by createdAt descending to avoid index requirement
        const sortedOrders = [...ordersData].sort((a, b) => {
          const getTime = (val: any) => {
            if (!val) return 0;
            if (typeof val.toMillis === 'function') return val.toMillis();
            if (val instanceof Date) return val.getTime();
            return new Date(val).getTime() || 0;
          };
          return getTime(b.createdAt) - getTime(a.createdAt);
        });
        setOrders(sortedOrders);
      });
    } else if (!selectedRestaurantId) {
      setMenu([]);
      setOrders([]);
    }

    return () => {
      if (menuUnsub) menuUnsub();
      if (ordersUnsub) ordersUnsub();
    };
  }, [dbInstance, selectedRestaurantId]);

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    if (!dbInstance) return;
    try {
      await addDoc(collection(dbInstance, 'menu'), {
        ...item,
        active: true
      });
      toast.success('品項已新增');
    } catch (e) {
      toast.error('新增失敗');
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    if (!dbInstance) return;
    try {
      await updateDoc(doc(dbInstance, 'menu', id), updates);
      toast.success('已更新');
    } catch (e) {
      toast.error('更新失敗');
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!dbInstance) return;
    try {
      await deleteDoc(doc(dbInstance, 'menu', id));
      toast.success('已刪除');
    } catch (e) {
      toast.error('刪除失敗');
    }
  };

  const addRestaurant = async (name: string) => {
    if (!dbInstance) {
      toast.error('系統尚未連接資料庫，請稍後或確認設定');
      return;
    }
    try {
      await addDoc(collection(dbInstance, 'restaurants'), {
        name,
        active: true,
        createdAt: serverTimestamp()
      });
      toast.success('餐廳已新增');
    } catch (e) {
      toast.error('新增失敗');
    }
  };

  const deleteRestaurant = async (id: string) => {
    if (!dbInstance) return;
    try {
      // In a real app we might want to delete all menu/orders too, but for simplicity:
      await deleteDoc(doc(dbInstance, 'restaurants', id));
      if (selectedRestaurantId === id) setSelectedRestaurantId(null);
      toast.success('餐廳已刪除');
    } catch (e) {
      toast.error('刪除失敗');
    }
  };

  const addOrder = async (customerName: string, notes: string, cart: { item: MenuItem, quantity: number }[]) => {
    if (!firebaseReady || !dbInstance || !selectedRestaurantId) {
      toast.error('系統尚未就緒或未選擇餐廳');
      return;
    }

    if (cart.length === 0) {
      toast.error('請選擇品項');
      return;
    }

    const loadingToast = toast.loading('點餐中...');
    try {
      const batch = writeBatch(dbInstance);
      
      for (const cartItem of cart) {
        const orderRef = doc(collection(dbInstance, 'orders'));
        batch.set(orderRef, {
          restaurantId: selectedRestaurantId,
          customerName,
          itemId: cartItem.item.id,
          itemName: cartItem.item.name,
          price: cartItem.item.price,
          quantity: cartItem.quantity,
          notes,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }
      
      await batch.commit();
      toast.dismiss(loadingToast);
      toast.success('點餐成功！');
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error('點餐失敗');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!firebaseReady || !dbInstance) return;
    await updateDoc(doc(dbInstance, 'orders', orderId), { status });
  };

  const updateMenu = async (restaurantId: string, newItems: MenuItem[]) => {
    if (!firebaseReady || !dbInstance) return;
    
    const loadingToast = toast.loading('上傳中...');
    try {
      // First delete existing menu for this restaurant (or we could just add new ones)
      // For simplicity of "updating" from Excel, we'll delete old ones
      const oldMenuQuery = query(collection(dbInstance, 'menu'), where('restaurantId', '==', restaurantId));
      const oldDocs = await getDocs(oldMenuQuery);
      
      const batch = writeBatch(dbInstance);
      oldDocs.forEach(d => batch.delete(d.ref));
      
      for (const item of newItems) {
        const itemRef = doc(collection(dbInstance, 'menu'));
        batch.set(itemRef, {
          restaurantId,
          name: item.name,
          price: item.price,
          category: item.category || '未分類',
          active: true,
        });
      }
      
      await batch.commit();
      toast.dismiss(loadingToast);
      toast.success('菜單已更新');
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error('上傳失敗');
    }
  };

  const resetTodayOrders = async (restaurantId: string) => {
    if (!dbInstance) return;
    const loadingToast = toast.loading('正在重設數據...');
    try {
      const q = query(collection(dbInstance, 'orders'), where('restaurantId', '==', restaurantId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(dbInstance);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast.dismiss(loadingToast);
      toast.success('數據已歸零');
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error('歸零失敗');
    }
  };

  return (
    <AppContext.Provider value={{ 
      restaurants, 
      selectedRestaurantId, 
      setSelectedRestaurantId,
      menu, 
      orders, 
      addOrder, 
      updateOrderStatus, 
      updateMenu, 
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addRestaurant,
      deleteRestaurant,
      resetTodayOrders,
      loading, 
      firebaseReady 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
