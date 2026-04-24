export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  active: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  notes: string;
  itemId: string;
  itemName: string;
  price: number;
  status: 'pending' | 'cooking' | 'ready' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp
}

export type AppMode = 'customer' | 'admin';
