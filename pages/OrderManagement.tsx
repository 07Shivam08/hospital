
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Order } from '../types';
import { 
  ShoppingCart, 
  Search, 
  Calendar, 
  Clock, 
  Filter, 
  Pill,
  Printer,
  Trash2,
  ChevronRight
} from 'lucide-react';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customDate, setCustomDate] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, [dateFilter, customDate]);

  const fetchOrders = async () => {
    setLoading(true);
    // Fetching from "Orders" as per the provided schema
    let query = supabase.from('Orders').select(`
      *,
      Patient (p_name)
    `);

    const now = new Date();
    
    if (dateFilter === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      query = query.gte('order_date', start).lte('order_date', end);
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const start = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();
      query = query.gte('order_date', start).lte('order_date', end);
    } else if (dateFilter === 'custom' && customDate) {
      const start = new Date(new Date(customDate).setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(new Date(customDate).setHours(23, 59, 59, 999)).toISOString();
      query = query.gte('order_date', start).lte('order_date', end);
    }

    const { data, error } = await query.order('order_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const deleteOrder = async (id: string) => {
    if (confirm('Permanently delete this order record? This will not revert inventory changes.')) {
      const { error } = await supabase.from('Orders').delete().eq('order_id', id);
      if (!error) fetchOrders();
    }
  };

  const filteredOrders = orders.filter(order => {
    const patientName = (order as any).Patient?.p_name || '';
    // Use the JSONB 'medicine' field for the name
    const medicineName = order.medicine?.medicine_name || '';
    const bedNumber = order.bed_number || '';
    
    const search = searchTerm.toLowerCase();
    return patientName.toLowerCase().includes(search) ||
           medicineName.toLowerCase().includes(search) ||
           bedNumber.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Filter by Patient, Medicine, Bed..." 
              className="pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl w-full outline-none focus:ring-4 focus:ring-blue-100 shadow-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl shadow-inner">
            {[
              { id: 'all', label: 'All History' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'custom', label: 'By Date' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  dateFilter === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-2 animate-in slide-in-from-left-2">
              <input 
                type="date" 
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <button 
          onClick={() => window.print()}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-slate-100 transition-all active:scale-95 whitespace-nowrap"
        >
          <Printer size={20} />
          <span>Export Records</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Orders Registry</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Comprehensive medication tracking</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
             <span className="text-sm font-black text-blue-600">{filteredOrders.length}</span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Total Entries</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Details</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medication Info</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Quantity</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Timestamp</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-r-4 border-r-transparent mb-4"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Orders...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="bg-slate-50 p-10 rounded-[40px] w-fit mx-auto mb-6">
                      <ShoppingCart className="text-slate-200" size={64} />
                    </div>
                    <p className="text-slate-400 font-black text-2xl uppercase tracking-widest leading-none">Empty Registry</p>
                    <p className="text-slate-400 mt-3 font-bold text-sm">No orders match your current filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const patientName = (order as any).Patient?.p_name || 'Anonymous Patient';
                  const medicineData = order.medicine;
                  return (
                    <tr key={order.order_id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-10 py-7">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg">
                            {patientName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base leading-none mb-1.5">
                              {patientName}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                                Unit {order.bed_number || 'Walk-in'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            <Pill size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">
                              {medicineData?.medicine_name || 'Generic Medicine'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Batch: {medicineData?.serial_number || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-center">
                        <span className="px-5 py-2 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-lg shadow-slate-100">
                          x{order.ordered_quantity}
                        </span>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex flex-col">
                          <div className="flex items-center text-slate-900 font-black text-sm">
                            <Calendar size={14} className="mr-2 text-blue-600" />
                            {new Date(order.order_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="flex items-center text-slate-500 font-bold text-[11px] mt-1 uppercase tracking-tighter">
                            <Clock size={12} className="mr-2" />
                            {new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <button 
                          onClick={() => deleteOrder(order.order_id)}
                          className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                          title="Purge Record"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
