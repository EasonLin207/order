import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { MenuItem } from '../types';
import { Send, CheckCircle2, ShoppingBag, Store, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrderForm: React.FC = () => {
  const { menu, addOrder, restaurants, selectedRestaurantId, setSelectedRestaurantId } = useApp();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedItem) return;

    setIsSubmitting(true);
    await addOrder(name, selectedItem, notes);
    setIsSubmitting(false);
    setSubmitted(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setNotes('');
      setSelectedItem(null);
    }, 3000);
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
                    {items.filter(item => item.active).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className={`flex flex-col text-left p-5 rounded-2xl border-4 transition-all ${
                          selectedItem?.id === item.id
                            ? 'bg-primary text-white border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] translate-y-[-2px]'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <ShoppingBag size={20} className={selectedItem?.id === item.id ? 'text-white' : 'text-slate-400'} />
                          <span className={`font-black text-xl ${selectedItem?.id === item.id ? 'text-white/80' : 'text-primary'}`}>
                            ${item.price}
                          </span>
                        </div>
                        <span className="font-black text-lg leading-tight">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="brutal-card">
              <label className="block text-sm font-black mb-2 uppercase tracking-wide">口味與備註 (可選)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：糖度冰塊、不要香菜、要辣..."
                className="w-full h-24 p-4 border-4 border-slate-900 rounded-xl focus:ring-0 focus:border-primary transition-colors bg-slate-50 resize-none font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || !selectedItem}
            className={`w-full py-5 brutal-button text-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubmitting ? 'animate-pulse' : ''
            }`}
          >
            <Send size={24} strokeWidth={3} />
            {isSubmitting ? '正在提交...' : '確定點餐'}
          </button>
        </form>
      )}
    </div>
  );
};
