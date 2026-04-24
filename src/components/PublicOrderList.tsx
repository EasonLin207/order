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

  return (
    <div className="mt-12 space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary p-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <Users className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">大家點了什麼 ({enhancedOrders.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {enhancedOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-black text-lg text-slate-900 flex items-center gap-2">
                    {order.customerName}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-black uppercase ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      order.status === 'cooking' ? 'bg-primary/10 text-primary border-primary/20' :
                      order.status === 'ready' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                      'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {order.status === 'pending' ? '待處理' : 
                       order.status === 'cooking' ? '製作中' : 
                       order.status === 'ready' ? '已完成' : '已取消'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <Clock size={10} />
                    {formatTime(order.createdAt)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border-2 border-slate-200 flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg border-2 border-slate-100 font-black text-primary min-w-[40px] text-center">
                  x{order.quantity || 1}
                </div>
                <div>
                  <div className="font-black text-slate-900 leading-tight">{order.itemName}</div>
                  {order.notes && (
                    <div className="text-xs text-slate-500 font-medium italic mt-0.5">
                      「{order.notes}」
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
