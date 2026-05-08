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

  const totalOrders = filteredOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const totalOrdersWithNotes = filteredOrders
    .filter(o => o.notes && o.notes.trim() !== '')
    .reduce((sum, o) => sum + (o.quantity || 1), 0);
  
  // Group by item for summary
  const orderStats = filteredOrders.reduce((acc, order) => {
    let name = order.itemName;
    if (!name && order.itemId) {
      const menuItem = menu.find(m => m.id === order.itemId);
      name = menuItem?.name || '未知品項';
    } else if (!name) {
      name = '未知品項';
    }
    
    if (!acc[name]) {
      acc[name] = { total: 0, withNotes: 0, notes: [] };
    }
    
    acc[name].total += (order.quantity || 1);
    const note = (order.notes || '').trim();
    if (note) {
      acc[name].withNotes += (order.quantity || 1);
      acc[name].notes.push(note);
    }
    return acc;
  }, {} as Record<string, { total: number, withNotes: number, notes: string[] }>);

  const sortedStats = (Object.entries(orderStats) as [string, { total: number, withNotes: number, notes: string[] }][]).sort((a, b) => b[1].total - a[1].total);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <Users className="text-white" size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">大家點了什麼</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white border-2 border-slate-900 rounded-xl px-4 py-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">今日份數</div>
            <div className="text-xl font-black text-slate-900 leading-none">{totalOrders}</div>
          </div>
          {totalOrdersWithNotes > 0 && (
            <div className="bg-amber-50 border-2 border-amber-500 rounded-xl px-4 py-2 shadow-[3px_3px_0px_0px_rgba(245,158,11,1)]">
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">特殊備註</div>
              <div className="text-xl font-black text-amber-600 leading-none">{totalOrdersWithNotes}</div>
            </div>
          )}
        </div>
      </div>

      <div className="brutal-card bg-white border-slate-900 mb-12 p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 py-2 px-6 bg-slate-100 border-l-4 border-b-4 border-slate-900 font-black text-xs uppercase tracking-widest text-slate-500 rounded-bl-3xl">
          Order Summary
        </div>
        
        <h3 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="text-primary" size={28} />
          餐點統計總覽
        </h3>
        
        <div className="space-y-6">
          {(sortedStats as [string, { total: number, withNotes: number, notes: string[] }][]).map(([name, stats]) => (
            <div key={name} className="space-y-3">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="text-xl font-black text-slate-900">{name}</span>
                    {stats.withNotes > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200">
                        {stats.withNotes} 份含備註
                      </span>
                    )}
                  </div>
                  {stats.notes.length > 0 && (
                    <div className="bg-amber-50/50 p-2 rounded-lg border border-dashed border-amber-100 mt-1">
                      <div className="text-[10px] font-black text-amber-600 uppercase mb-1">備註細節：</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {Array.from(new Set(stats.notes)).map((note, nIdx) => {
                          const count = stats.notes.filter(n => n === note).length;
                          return (
                            <span key={nIdx} className="text-xs font-bold text-slate-600">
                              • {note} {count > 1 ? `(x${count})` : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <span className="text-3xl font-black text-primary">{stats.total}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">份</span>
                </div>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full border-2 border-slate-900 p-0.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.total / Math.max(totalOrders, 1)) * 100}%` }}
                  className="bg-primary h-full border-r-2 border-slate-900"
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">總計</span>
                      <span className="text-sm font-black text-primary">${items.reduce((sum, o) => sum + (o.price * o.quantity), 0)}</span>
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
