import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { MenuItem } from '../types';
import { 
  TrendingUp, 
  Package, 
  Upload, 
  RefreshCcw, 
  Clock, 
  Trash2,
  FileText,
  RotateCcw,
  Plus,
  Store,
  ChevronRight,
  AlertCircle,
  Edit2,
  CheckCircle2,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const { 
    orders, 
    restaurants, 
    selectedRestaurantId, 
    setSelectedRestaurantId,
    menu, 
    updateMenu, 
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    deleteOrder,
    addRestaurant, 
    deleteRestaurant,
    toggleRestaurantActive,
    resetTodayOrders 
  } = useApp();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);

  // Manual Menu Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    category: ''
  });

  // Statistics for selected restaurant
  const filteredOrders = orders.filter(o => o.restaurantId === selectedRestaurantId);
  const totalOrders = filteredOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const totalOrdersWithNotes = filteredOrders
    .filter(o => o.notes && o.notes.trim() !== '')
    .reduce((sum, o) => sum + (o.quantity || 1), 0);
  
  // Group by item for summary
  const orderStats = filteredOrders.reduce((acc, order) => {
    // Try to get name from order, fallback to menu lookup, then '未知品項'
    let name = (order.itemName || '').trim();
    if (!name && order.itemId) {
      const menuItem = menu.find(m => m.id === order.itemId);
      name = (menuItem?.name || '').trim();
    }
    
    if (!name) {
      name = '未知品項';
    }
    
    if (!acc[name]) {
      acc[name] = { total: 0, withNotes: 0 };
    }
    
    acc[name].total += (order.quantity || 1);
    if (order.notes && order.notes.trim() !== '') {
      acc[name].withNotes += (order.quantity || 1);
    }
    return acc;
  }, {} as Record<string, { total: number, withNotes: number }>);

  const sortedStats = (Object.entries(orderStats) as [string, { total: number, withNotes: number }][]).sort((a, b) => b[1].total - a[1].total);

  // Group by person for individual details
  const personOrders = filteredOrders.reduce((acc, order) => {
    const customer = (order.customerName || '匿名用戶').trim();
    if (!acc[customer]) {
      acc[customer] = [];
    }
    
    // Ensure order in group also has a visible name
    const orderWithPossibleName = { ...order };
    let name = (orderWithPossibleName.itemName || '').trim();
    if (!name && order.itemId) {
      const menuItem = menu.find(m => m.id === order.itemId);
      name = (menuItem?.name || '').trim();
    }
    
    orderWithPossibleName.itemName = name || '未知品項';
    
    acc[customer].push(orderWithPossibleName);
    return acc;
  }, {} as Record<string, typeof filteredOrders>);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedRestaurantId) {
      toast.error('請先選擇一家餐廳');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newMenu: MenuItem[] = data.map((row, idx) => ({
          id: row.id || `item-${idx}`,
          restaurantId: selectedRestaurantId,
          name: row.name || row.品項 || row.名稱 || row.Name,
          price: Number(row.price || row.價格 || row.單價 || row.Price),
          category: row.category || row.分類 || row.Category || '精選品項',
          active: true
        })).filter(item => item.name && !isNaN(item.price));

        if (newMenu.length === 0) {
          throw new Error('找不到有效的品項資料');
        }

        await updateMenu(selectedRestaurantId, newMenu);
      } catch (err) {
        console.error(err);
        toast.error('檔案解析失敗，請確保欄位有 [name, price, category]');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantName.trim()) return;
    await addRestaurant(newRestaurantName.trim());
    setNewRestaurantName('');
    setIsAddingRestaurant(false);
  };

  const handleReset = async () => {
    if (!selectedRestaurantId) return;
    // Removing window.confirm as it might be blocked in some environments/iframes
    await resetTodayOrders(selectedRestaurantId);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId) return;
    if (!itemForm.name || !itemForm.price) {
      toast.error('請填寫品項名稱與價格');
      return;
    }

    const payload = {
      restaurantId: selectedRestaurantId,
      name: itemForm.name,
      price: Number(itemForm.price),
      category: itemForm.category || '精選品項',
      active: true
    };

    if (editingItemId) {
      await updateMenuItem(editingItemId, payload);
      setEditingItemId(null);
    } else {
      await addMenuItem(payload);
      setIsAddingItem(false);
    }
    setItemForm({ name: '', price: '', category: '' });
  };

  const startEdit = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      price: item.price.toString(),
      category: item.category || ''
    });
    setIsAddingItem(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Restaurant Selection & Management */}
      <div className="brutal-card bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Store className="text-secondary" /> 餐廳管理
          </h2>
          <button 
            onClick={() => setIsAddingRestaurant(!isAddingRestaurant)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Plus size={24} className={isAddingRestaurant ? 'rotate-45 transition-transform' : 'transition-transform'} />
          </button>
        </div>

        <AnimatePresence>
          {isAddingRestaurant && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddRestaurant}
              className="mb-6 overflow-hidden"
            >
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newRestaurantName}
                  onChange={(e) => setNewRestaurantName(e.target.value)}
                  placeholder="輸入新餐廳名稱"
                  className="flex-1 p-3 border-4 border-slate-900 rounded-xl font-bold"
                />
                <button type="submit" className="bg-primary text-white px-6 rounded-xl border-4 border-slate-900 font-black">
                  新增
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map(r => (
            <div 
              key={r.id}
              onClick={() => setSelectedRestaurantId(r.id)}
              className={`p-6 rounded-3xl border-4 transition-all relative group cursor-pointer ${
                selectedRestaurantId === r.id 
                  ? 'border-slate-900 bg-secondary shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] translate-y-[-2px] text-white' 
                  : 'border-slate-300 bg-white hover:border-slate-900 text-slate-900 shadow-[4px_4px_0px_0px_rgba(203,213,225,1)] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]'
              }`}
            >
              <div className="pr-10">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`text-[10px] font-black uppercase tracking-widest ${selectedRestaurantId === r.id ? 'text-white/60' : 'text-slate-400'}`}>
                    Restaurant ID: {r.id.substring(0, 8)}
                  </div>
                  {r.active && (
                    <span className="bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black leading-tight break-words">{r.name}</div>
              </div>
              
              <div className="absolute top-6 right-6 flex flex-col gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRestaurantActive(r.id, !r.active);
                  }}
                  title={r.active ? "設為不公開" : "目前設為公開顯示"}
                  className={`p-2 rounded-xl border-2 transition-all ${
                    r.active 
                      ? 'bg-green-500 border-white text-white' 
                      : 'bg-white border-slate-200 text-slate-300 hover:text-green-500 hover:border-green-500'
                  }`}
                >
                  <CheckCircle2 size={18} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRestaurant(r.id);
                  }}
                  className={`p-2 rounded-xl transition-all ${
                    selectedRestaurantId === r.id ? 'hover:bg-white/20 text-white' : 'text-slate-300 hover:bg-red-500 hover:text-white hover:border-slate-900 border-2 border-transparent'
                  }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {restaurants.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-400 font-bold border-4 border-dashed border-slate-100 rounded-2xl">
              尚未建立任何餐廳
            </div>
          )}
        </div>
      </div>

      {!selectedRestaurantId ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-4 border-dashed border-slate-200">
          <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-black text-xl">請先選擇一家餐廳進行管理</p>
        </div>
      ) : (
        <motion.div 
          key={selectedRestaurantId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top Bar: Stats & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-secondary p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-white flex justify-between items-center md:col-span-1">
              <div>
                <div className="text-sm font-black uppercase opacity-80 flex items-center gap-2">
                  <Package size={16} /> 本日點餐數
                </div>
                <div className="text-5xl font-black">{totalOrders}</div>
                {totalOrdersWithNotes > 0 && (
                  <div className="text-xs font-black mt-2 bg-white/20 px-2 py-1 rounded-lg inline-flex items-center gap-1.5 border border-white/10">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                    其中 {totalOrdersWithNotes} 份含備註
                  </div>
                )}
              </div>
              <RefreshCcw size={32} className="opacity-20 animate-spin" style={{ animationDuration: '5s' }} />
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between text-slate-900 hover:bg-slate-50 transition-all cursor-pointer group md:col-span-1"
            >
              <div className="text-left">
                <div className="text-sm font-black uppercase opacity-60 flex items-center gap-2">
                  <Upload size={16} /> 菜單更新
                </div>
                <div className="text-xl font-black">{isUploading ? '正在處理...' : '匯入菜單 (Excel)'}</div>
              </div>
              <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                <Upload size={24} strokeWidth={2.5} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
              />
            </button>

            <button 
              onClick={handleReset}
              className="bg-red-500 p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-white flex items-center justify-between hover:bg-red-600 transition-all cursor-pointer group md:col-span-1"
            >
              <div className="text-left">
                <div className="text-sm font-black uppercase opacity-80 flex items-center gap-2">
                  <RotateCcw size={16} /> 維護操作
                </div>
                <div className="text-xl font-black">今日數據歸零</div>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <RotateCcw size={24} strokeWidth={2.5} />
              </div>
            </button>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Item Summary Card */}
            <div className="brutal-card bg-white text-slate-900 border-slate-900 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <TrendingUp size={28} className="text-primary" /> 
                  餐點統計總覽
                </h2>
                <div className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest text-slate-400">
                  Order Summary
                </div>
              </div>
              
              <div className="space-y-6 flex-1">
                {(sortedStats as [string, { total: number, withNotes: number }][]).map(([name, stats]) => (
                  <div key={name} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-lg font-black text-slate-900">{name}</span>
                        {stats.withNotes > 0 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200">
                            {stats.withNotes} 份含備註
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-primary">{stats.total}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">份</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border-2 border-slate-200">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.total / Math.max(totalOrders, 1)) * 100}%` }}
                        className="bg-primary h-full"
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
                
                {sortedStats.length === 0 && (
                  <div className="py-20 text-center flex-1 flex flex-col justify-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                      <Package size={32} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 text-lg font-bold">目前無任何訂單統計資料</p>
                  </div>
                )}
              </div>
            </div>

            {/* Individual Orders Card */}
            <div className="brutal-card bg-white border-slate-900 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                  <FileText size={28} className="text-secondary" /> 
                  個別訂單明細
                </h2>
                <div className="bg-secondary/10 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest text-secondary">
                  Customer Details
                </div>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {Object.entries(personOrders).map(([customerName, orders]: [string, any[]]) => (
                  <motion.div 
                    key={customerName}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-2xl border-4 border-slate-100 bg-slate-50 hover:border-slate-900 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">
                          {customerName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-lg">{customerName}</h4>
                          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            Total: ${orders.reduce((sum, o) => sum + (o.price * o.quantity), 0)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-slate-200 px-2 py-0.5 rounded-lg text-slate-500">
                        {orders.length} items
                      </span>
                    </div>
                    <div className="space-y-2">
                      {orders.map((o, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border-2 border-slate-100 group-hover:border-slate-200 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-secondary">x{o.quantity}</span>
                            <span className="font-bold text-slate-700 text-sm">{o.itemName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">${o.price * o.quantity}</span>
                            <button 
                              onClick={() => deleteOrder(o.id)}
                              className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                              title="刪除此項點餐"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {orders[0]?.notes && (
                      <div className="mt-3 bg-primary/5 p-2 rounded-lg border-2 border-primary/10">
                        <div className="flex items-center gap-1 mb-1 text-[10px] font-black uppercase text-primary">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full" /> 備註
                        </div>
                        <p className="text-xs font-bold text-slate-600 italic">"{orders[0].notes}"</p>
                      </div>
                    )}
                  </motion.div>
                ))}

                {Object.keys(personOrders).length === 0 && (
                  <div className="py-20 text-center flex-1 flex flex-col justify-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                      <Clock size={32} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 text-lg font-bold">等待第一張訂單進場...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Menu Management */}
          <div className="brutal-card bg-white mt-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <FileText size={28} className="text-primary" /> 
                菜單品項管理
              </h2>
              <button 
                onClick={() => {
                  setIsAddingItem(!isAddingItem);
                  setEditingItemId(null);
                  setItemForm({ name: '', price: '', category: '' });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black border-4 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all ${
                  isAddingItem ? 'bg-slate-100' : 'bg-primary text-white'
                }`}
              >
                {isAddingItem ? <X size={20} /> : <Plus size={20} />}
                {isAddingItem ? '取消' : '手動新增品項'}
              </button>
            </div>

            <AnimatePresence>
              {isAddingItem && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-10 overflow-hidden"
                >
                  <form onSubmit={handleItemSubmit} className="p-8 bg-slate-50 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div>
                        <label className="block text-sm font-black uppercase mb-2 text-slate-900">品項名稱</label>
                        <input 
                          required
                          type="text" 
                          value={itemForm.name}
                          onChange={e => setItemForm({...itemForm, name: e.target.value})}
                          placeholder="例如：熱美式"
                          className="w-full p-4 border-4 border-slate-900 rounded-2xl font-black bg-white focus:border-primary transition-colors text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-black uppercase mb-2 text-slate-900">價格 (數字)</label>
                        <input 
                          required
                          type="number" 
                          value={itemForm.price}
                          onChange={e => setItemForm({...itemForm, price: e.target.value})}
                          placeholder="0"
                          className="w-full p-4 border-4 border-slate-900 rounded-2xl font-black bg-white focus:border-primary transition-colors text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-black uppercase mb-2 text-slate-900">分類 (例如：飲品)</label>
                        <input 
                          type="text" 
                          value={itemForm.category}
                          onChange={e => setItemForm({...itemForm, category: e.target.value})}
                          placeholder="例如：主食類"
                          className="w-full p-4 border-4 border-slate-900 rounded-2xl font-black bg-white focus:border-primary transition-colors text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-[4px_4px_0px_0px_rgba(255,107,53,1)] hover:translate-y-[-2px] active:translate-y-[0px] transition-all">
                        {editingItemId ? '更新此品項' : '確認手動新增'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-4 border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4">品項名稱</th>
                    <th className="pb-4">分類</th>
                    <th className="pb-4">價格</th>
                    <th className="pb-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {menu.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-black text-slate-900">{item.name}</td>
                      <td className="py-4">
                        <span className="bg-slate-100 px-2 py-1 rounded-lg text-xs font-black text-slate-500 uppercase">
                          {item.category || '精選品項'}
                        </span>
                      </td>
                      <td className="py-4 font-black text-primary">${item.price}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => startEdit(item)}
                            className="p-2 text-slate-400 hover:text-secondary transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteMenuItem(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {menu.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-bold">
                        目前此餐廳尚無任何品項，請手動新增或匯入 Excel。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
