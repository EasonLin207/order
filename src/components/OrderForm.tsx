import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { MenuItem } from '../types';
import { Send, CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrderForm: React.FC = () => {
  const { menu, addOrder } = useApp();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        <h2 className="text-3xl font-black mb-2">訂購成功！</h2>
        <p className="text-slate-500 font-bold">我們已收到您的訂單，正在為您準備中。</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-2">今天想吃什麼？</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">- 選擇美味便當 -</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full p-4 text-lg border-4 border-slate-900 rounded-xl focus:ring-0 focus:border-brand transition-colors bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-black mb-2 uppercase tracking-wide">選擇便當</label>
              <div className="grid grid-cols-1 gap-3">
                {menu.filter(item => item.active).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`flex justify-between items-center p-4 rounded-xl border-4 transition-all ${
                      selectedItem?.id === item.id
                        ? 'bg-brand text-white border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] translate-y-[-2px]'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={20} className={selectedItem?.id === item.id ? 'text-white' : 'text-slate-400'} />
                      <span className="font-black text-lg">{item.name}</span>
                    </div>
                    <span className={`font-bold ${selectedItem?.id === item.id ? 'text-white/80' : 'text-brand'}`}>
                      ${item.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-black mb-2 uppercase tracking-wide">備註 (可選)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：去蔥、飯少、蛋半熟..."
                className="w-full h-24 p-4 border-4 border-slate-900 rounded-xl focus:ring-0 focus:border-brand transition-colors bg-slate-50 resize-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name || !selectedItem}
          className={`w-full py-5 brutal-button text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
            isSubmitting ? 'animate-pulse' : ''
          }`}
        >
          <Send size={24} strokeWidth={3} />
          {isSubmitting ? '提交中...' : '立即下單'}
        </button>
      </form>
    </div>
  );
};
