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
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-secondary p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-black uppercase opacity-80 flex items-center gap-2">
              <Package size={16} /> 總訂單數
            </div>
            <RefreshCcw size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="text-5xl font-black">{totalOrders}</div>
        </div>

        <div className="bg-accent p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-black uppercase opacity-80 flex items-center gap-2">
              <TrendingUp size={16} /> 最受歡迎
            </div>
          </div>
          <div className="text-2xl font-black truncate">{mostPopular}</div>
          <div className="text-sm font-bold mt-2 bg-white/20 inline-block px-2 py-1 rounded">
            {sortedStats[0] ? `${sortedStats[0][1]} 份訂單` : '0 份'}
          </div>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-white p-6 rounded-3xl border-4 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all cursor-pointer group hover:bg-primary/5"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
          />
          <Upload size={32} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          <div className="text-sm font-black mt-2 uppercase">
            {isUploading ? '處理中...' : '上傳菜單 (Excel/CSV)'}
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Order Queue */}
        <div className="lg:col-span-8 space-y-6">
          <div className="brutal-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
                即時訂單隊列 
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-4 border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4">客戶名稱</th>
                    <th className="pb-4">品項</th>
                    <th className="pb-4">備註</th>
                    <th className="pb-4 text-right">狀態</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4">
                        <div className="font-black text-slate-900">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                          <Clock size={10} /> {formatTime(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="bg-slate-100 px-2 py-1 rounded-lg font-bold text-slate-700">
                          {order.itemName}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className="text-slate-400 italic font-medium max-w-[150px] truncate">
                          {order.notes || '-'}
                        </p>
                      </td>
                      <td className="py-4 text-right">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                          className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 cursor-pointer transition-all ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            order.status === 'cooking' ? 'bg-primary/10 text-primary border-primary/20' :
                            order.status === 'ready' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                            'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          <option value="pending">等候中</option>
                          <option value="cooking">製作中</option>
                          <option value="ready">可取餐</option>
                          <option value="delivered">已送達</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-bold">
                        目前尚無訂單
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="brutal-card bg-slate-900 text-white border-slate-900">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" /> 銷售統計
            </h2>
            <div className="space-y-4">
              {sortedStats.map(([name, count]) => (
                <div key={name} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{name}</span>
                    <span className="text-primary font-black">{count} 份</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((count as number) / totalOrders) * 100}%` }}
                      className="bg-primary h-full"
                    />
                  </div>
                </div>
              ))}
              {sortedStats.length === 0 && (
                <p className="text-white/40 text-center font-bold py-4">暫無統計資料</p>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-900">
              <FileText size={18} className="text-secondary" /> 菜單品項 ({menu.length})
            </h3>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {menu.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">{item.name}</span>
                  <span className="font-black text-primary">${item.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
