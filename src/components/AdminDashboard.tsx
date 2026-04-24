import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { Order, MenuItem } from '../types';
import { 
  TrendingUp, 
  Package, 
  Upload, 
  RefreshCcw, 
  Clock, 
  Trash2,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { formatTime } from '../lib/utils';

export const AdminDashboard: React.FC = () => {
  const { orders, menu, updateOrderStatus, updateMenu } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Statistics
  const totalOrders = orders.length;
  const orderStats = orders.reduce((acc, order) => {
    acc[order.itemName] = (acc[order.itemName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedStats = Object.entries(orderStats).sort((a, b) => (b[1] as number) - (a[1] as number));
  const mostPopular = sortedStats[0]?.[0] || '無數據';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          name: row.name || row.品項 || row.名稱,
          price: Number(row.price || row.價格 || row.單價),
          active: true
        })).filter(item => item.name && !isNaN(item.price));

        await updateMenu(newMenu);
        alert(`成功上傳 ${newMenu.length} 個品項！`);
      } catch (err) {
        console.error(err);
        alert('檔案解析失敗，請確保包含 [name] 與 [price] 欄位。');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      {/* Top Bar: Total & Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-secondary p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-white flex justify-between items-center">
          <div>
            <div className="text-sm font-black uppercase opacity-80 flex items-center gap-2">
              <Package size={16} /> 總點餐數量
            </div>
            <div className="text-5xl font-black">{totalOrders}</div>
          </div>
          <RefreshCcw size={32} className="opacity-20 animate-spin" style={{ animationDuration: '5s' }} />
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex items-center justify-between text-slate-900 hover:bg-slate-50 transition-all cursor-pointer group"
        >
          <div className="text-left">
            <div className="text-sm font-black uppercase opacity-60 flex items-center gap-2">
              <Upload size={16} /> 菜單管理
            </div>
            <div className="text-xl font-black">{isUploading ? '正在上傳...' : '更新菜單內容'}</div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
          />
          <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
            <Upload size={24} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Main Stats */}
      <div className="brutal-card bg-slate-900 text-white border-slate-900">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
          <TrendingUp size={28} className="text-primary" /> 
          各品項統計數量
        </h2>
        
        <div className="space-y-6">
          {sortedStats.map(([name, count]) => (
            <div key={name} className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-lg font-black">{name}</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-primary">{count}</span>
                  <span className="text-xs font-bold text-white/40 ml-1">份</span>
                </div>
              </div>
              <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden border-2 border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((count as number) / totalOrders) * 100}%` }}
                  className="bg-primary h-full shadow-[0_0_10px_rgba(255,107,53,0.5)]"
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
          
          {sortedStats.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-white/10">
                <Package size={32} className="text-white/20" />
              </div>
              <p className="text-white/40 text-lg font-bold">目前無任何訂單統計資料</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
