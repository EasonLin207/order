import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { MenuItem } from '../types';
import { Send, CheckCircle2, ShoppingBag, Store, ChevronRight, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrderForm: React.FC = () => {
  const { menu, addOrder, restaurants, selectedRestaurantId, setSelectedRestaurantId } = useApp();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        <h2 className="text-4xl font-black text-slate-900 mb-2">團購點餐</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">- 選擇餐廳與美味點心 -</p>
      </div>

      {!selectedRestaurantId ? (
        <div className="space-y-6">
          <div className="brutal-card">
            <label className="block text-xl font-black mb-6 uppercase tracking-wide flex items-center gap-2">
              <Store className="text-primary" /> 請選擇餐廳
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurants.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRestaurantId(r.id)}
                  className="bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-2px] transition-all flex justify-between items-center group"
                >
                  <span className="text-xl font-black">{r.name}</span>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
              {restaurants.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-bold">
                  目前沒有可用的餐廳
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
          {/* Back Button */}
          <button 
            type="button"
            onClick={() => {
              setSelectedRestaurantId(null);
              setSelectedItem(null);
            }}
            className="flex items-center gap-2 text-slate-400 font-black hover:text-primary transition-colors text-sm mb-4"
          >
            ← 切換餐廳 ({selectedRestaurant?.name})
          </button>

          <div className="space-y-8">
            {/* Identity Info */}
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
              {(Object.entries(categorizedMenu) as [string, MenuItem[]][]).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xl font-black flex items-center gap-2 text-slate-900">
                    <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-primary text-sm font-black">
                      #
                    </span>
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.filter(item => item.active).map((item) => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col p-5 rounded-2xl border-4 transition-all relative ${
                            qty > 0
                              ? 'bg-primary text-white border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] translate-y-[-2px]'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <ShoppingBag size={20} className={qty > 0 ? 'text-white' : 'text-slate-400'} />
                            <span className={`font-black text-xl ${qty > 0 ? 'text-white/80' : 'text-primary'}`}>
                              ${item.price}
                            </span>
                          </div>
                          <span className="font-black text-lg leading-tight mb-4">{item.name}</span>
                          
                          <div className="mt-auto flex items-center justify-between gap-2 bg-slate-900/10 p-2 rounded-xl">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className={`p-1 rounded-lg transition-colors ${
                                qty > 0 ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400'
                              }`}
                            >
                              <Minus size={18} strokeWidth={3} />
                            </button>
                            <span className="font-black text-lg w-8 text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className={`p-1 rounded-lg transition-colors ${
                                qty > 0 ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400'
                              }`}
                            >
                              <Plus size={18} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="brutal-card bg-slate-900 text-white border-slate-900"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="text-primary" />
                  <h3 className="font-black text-lg uppercase tracking-wider">點餐備忘錄</h3>
                </div>
                <div className="space-y-2 mb-6">
                  {cartItems.map(ci => (
                    <div key={ci.item.id} className="flex justify-between items-center text-sm">
                      <span className="font-bold">{ci.item.name} x {ci.quantity}</span>
                      <span className="font-black text-primary">${ci.item.price * ci.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center bg-white/5 -mx-2 px-2 mt-2 py-2 rounded-lg">
                    <span className="font-black uppercase text-xs opacity-60">總計金額</span>
                    <span className="text-2xl font-black text-primary">${totalPrice}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black mb-2 uppercase tracking-wide opacity-60 flex items-center gap-2">
                    如有特殊備註 (如：不加辣、去冰)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="請輸入備註內容..."
                    className="w-full h-20 p-4 border-2 border-white/20 rounded-xl focus:ring-0 focus:border-primary transition-colors bg-white/5 resize-none font-medium placeholder:text-white/20"
                  />
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
