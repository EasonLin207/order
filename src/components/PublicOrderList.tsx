import React from 'react';
import { useApp } from '../store/AppContext';
import { Users, Clock, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '../lib/utils';

export const PublicOrderList: React.FC = () => {
  const { orders, selectedRestaurantId, menu, loading } = useApp();

  if (loading || !selectedRestaurantId || orders.length === 0) return null;

  const filteredOrders = orders.filter(o => o.restaurantId === selectedRestaurantId);
  
  if (filteredOrders.length === 0) return null;

  // Enhance orders with names if missing
  const enhancedOrders = filteredOrders.map(order => {
    if (!order.itemName && order.itemId) {
      const menuItem = menu.find(m => m.id === order.itemId);
      return { ...order, itemName: menuItem?.name || '未知品項' };
    }
    return { ...order, itemName: order.itemName || '未知品項' };
  });

  // Group orders by customer for a cleaner UI
  const personOrders = enhancedOrders.reduce((acc, order) => {
    const customer = (order.customerName || '匿名用戶').trim();
    if (!acc[customer]) {
      acc[customer] = [];
    }
    acc[customer].push(order);
    return acc;
  }, {} as Record<string, typeof enhancedOrders>);

  return (
    <div className="mt-12 space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary p-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <Users className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">大家點了什麼</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {(Object.entries(personOrders) as [string, any[]][]).map(([customerName, items], index) => (
            <motion.div
              key={customerName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 rounded-3xl border-4 border-slate-900 bg-white shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-2px] transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                    {customerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl">{customerName}</h4>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {items.length} items
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((o, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border-2 border-slate-100 group-hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-secondary bg-white px-2 py-1 rounded-lg border-2 border-slate-100 min-w-[36px] text-center">
                        x{o.quantity}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-base leading-tight">{o.itemName}</span>
                        {o.notes && (
                          <span className="text-xs text-slate-500 font-medium italic mt-0.5 opacity-70">
                            「{o.notes}」
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
