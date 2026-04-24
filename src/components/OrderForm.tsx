import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { MenuItem } from '../types';
import { Send, CheckCircle2, ShoppingBag, Store, ChevronRight, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrderForm: React.FC = () => {
  const { menu, addOrder, restaurants, selectedRestaurantId, setSelectedRestaurantId, loading } = useApp();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get uniquely ordered categories
  const orderedCategories = useMemo(() => {
    const categories: string[] = [];
    menu.forEach(item => {
      const cat = item.category || '精選品項';
      if (!categories.includes(cat)) categories.push(cat);
    });
    return categories;
  }, [menu]);

  // Group menu by category
  const categorizedMenu = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    menu.forEach(item => {
      const cat = item.category || '精選品項';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menu]);

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, quantity]) => {
      const item = menu.find(m => m.id === id);
      return item ? { item, quantity } : null;
    }).filter(Boolean) as { item: MenuItem, quantity: number }[];
  }, [cart, menu]);

  const totalPrice = cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || cartItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await addOrder(name, notes, cartItems);
      setSubmitted(true);
      setCart({});
      setName('');
      setNotes('');
      // Reset after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-4 border-dashed border-slate-200">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black">正在讀取今日餐廳資訊...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-100 text-green-600 p-6 rounded-full mb-6"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        <h2 className="text-3xl font-black mb-2">點餐成功！</h2>
      </div>
    );
  }

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-slate-900 mb-2">{selectedRestaurant?.name || '團購點餐'}</h2>
      </div>

      {!selectedRestaurantId ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-4 border-dashed border-slate-200">
          <Store size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-black text-xl">目前尚未開啟點餐</p>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">請聯絡管理員啟動餐廳</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
          <div className="space-y-8">
            <div className="brutal-card">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black mb-2 uppercase tracking-wide">您的姓名</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="請輸入姓名"
                    className="w-full p-4 text-lg border-4 border-slate-900 rounded-xl focus:ring-0 focus:border-primary transition-colors bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-10">
              {orderedCategories.map(category => {
                const items = categorizedMenu[category] || [];
                return (
                  <div key={category} className="space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-2 text-slate-900">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {items.filter(item => item.active).map((item) => {
                        const qty = cart[item.id] || 0;
                        return (
                          <motion.div
                            layout
                            key={item.id}
                            className={`flex flex-col p-4 rounded-2xl border-4 transition-all relative select-none cursor-pointer ${
                              qty > 0
                                ? 'border-slate-900 bg-secondary shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] translate-y-[-1px] text-white'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                            }`}
                            onClick={() => qty === 0 && updateQuantity(item.id, 1)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-black text-lg leading-tight flex-1">{item.name}</span>
                              <span className={`font-black text-xl ml-4 ${qty > 0 ? 'text-white' : 'text-primary'}`}>
                                ${item.price}
                              </span>
                            </div>
                            
                            <AnimatePresence>
                              {qty > 0 && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 pt-3 border-t-2 border-white/20 flex items-center justify-center">
                                    <div className="flex items-center gap-4 bg-white/20 p-1 rounded-xl">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateQuantity(item.id, -1);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-white/20 active:scale-90 transition-all"
                                      >
                                        <Minus size={18} strokeWidth={4} />
                                      </button>
                                      
                                      <span className="font-black text-lg w-6 text-center">
                                        {qty}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateQuantity(item.id, 1);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-white/20 active:scale-90 transition-all"
                                      >
                                        <Plus size={18} strokeWidth={4} />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="brutal-card bg-white text-slate-900 border-slate-900 overflow-hidden relative"
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <ShoppingBag size={20} className="text-white" />
                      </div>
                      <h3 className="font-black text-xl uppercase tracking-wider">點餐清單統計</h3>
                    </div>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-slate-500">
                      {cartItems.length} 個品項
                    </span>
                  </div>

                  <div className="space-y-3 mb-8">
                    {cartItems.map(ci => (
                      <div key={ci.item.id} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-black text-slate-900">
                            {ci.quantity}
                          </span>
                          <span className="font-bold text-slate-900">{ci.item.name}</span>
                        </div>
                        <span className="font-black text-primary tracking-tight">
                          ${ci.item.price * ci.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t-4 border-dashed border-slate-100 flex justify-between items-end mb-8">
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                        Total Amount
                      </span>
                      <span className="text-3xl font-black text-slate-900 leading-none">
                        ${totalPrice}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                        Subtotal
                      </span>
                      <span className="font-black text-slate-500 text-sm">
                        NTD ${totalPrice}.00
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-black mb-2 uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      備註與口味特殊要求
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="例如：去冰、微糖、不加辣..."
                      className="w-full h-24 p-4 border-4 border-slate-900 rounded-2xl focus:ring-0 focus:border-primary transition-all bg-white resize-none font-medium placeholder:text-slate-300 text-slate-900"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || cartItems.length === 0}
            className={`w-full py-5 brutal-button text-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubmitting ? 'animate-pulse' : ''
            }`}
          >
            <Send size={24} strokeWidth={3} />
            {isSubmitting ? '正在提交...' : `下單 (${cartItems.length} 個品項)`}
          </button>
        </form>
      )}
    </div>
  );
};
