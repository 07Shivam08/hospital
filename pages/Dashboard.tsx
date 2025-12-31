
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Bed, 
  Users, 
  AlertTriangle, 
  Package,
  Activity,
  ShoppingCart,
  Search,
  Calendar,
  Filter,
  Clock
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Bed as BedType, Medicine, Booking, Order } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    pastBookings: 0,
    activeBookings: 0,
    futureBookings: 0,
    totalPatients: 0,
    totalMedicines: 0,
    lowStockMedicines: 0,
    totalOrders: 0
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'today' | 'all'>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchOrders();
    
    // Updated realtime subscription to match "Orders" table
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Bed' }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const [
        { count: roomsCount },
        { data: bedsData },
        { count: patientsCount },
        { data: medicinesData },
        { data: bookingsData },
        { count: ordersCount }
      ] = await Promise.all([
        supabase.from('Room').select('*', { count: 'exact', head: true }),
        supabase.from('Bed').select('*'),
        supabase.from('Patient').select('*', { count: 'exact', head: true }),
        supabase.from('Medicine').select('*'),
        supabase.from('Booking').select('*'),
        supabase.from('Orders').select('*', { count: 'exact', head: true })
      ]);

      const beds = (bedsData || []) as BedType[];
      const medicines = (medicinesData || []) as Medicine[];
      const bookings = (bookingsData || []) as Booking[];

      const active = bookings.filter(b => b.booking_start_date <= now && b.booking_end_date >= now).length;
      const past = bookings.filter(b => b.booking_end_date < now).length;
      const future = bookings.filter(b => b.booking_start_date > now).length;

      setStats({
        totalRooms: roomsCount || 0,
        totalBeds: beds.length,
        // Use case-insensitive matching for statuses like 'AVAILABLE' or 'Available'
        occupiedBeds: beds.filter(b => (b.status || '').toUpperCase() === 'OCCUPIED').length,
        availableBeds: beds.filter(b => (b.status || '').toUpperCase() === 'AVAILABLE').length,
        pastBookings: past,
        activeBookings: active,
        futureBookings: future,
        totalPatients: patientsCount || 0,
        totalMedicines: medicines.length,
        lowStockMedicines: medicines.filter(m => m.quantity <= m.threshold_quantity).length,
        totalOrders: ordersCount || 0
      });

    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    let query = supabase.from('Orders').select(`
      *,
      Patient (p_name)
    `);

    if (orderFilter === 'today') {
      const today = new Date();
      today.setHours(0,0,0,0);
      query = query.gte('order_date', today.toISOString());
    }

    const { data } = await query.order('order_date', { ascending: false }).limit(10);
    setOrders(data || []);
  };

  const filteredOrders = orders.filter(o => 
    ((o as any).Patient?.p_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.medicine?.medicine_name || '').toLowerCase().includes(orderSearch.toLowerCase())
  );

  const occupancyData = [
    { name: 'Occupied', value: stats.occupiedBeds, color: '#2563eb' },
    { name: 'Available', value: stats.availableBeds, color: '#10b981' },
    { name: 'Maintenance', value: stats.totalBeds - stats.occupiedBeds - stats.availableBeds, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  if (loading && stats.totalBeds === 0) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 border-solid mb-4"></div>
      <p className="text-slate-600 font-bold">Synchronizing Dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Beds" value={stats.totalBeds} icon={Bed} color="blue" subtitle={`${stats.availableBeds} Ready`} />
        <StatCard title="Admissions" value={stats.activeBookings} icon={Users} color="white" subtitle="Active Cases" />
        <StatCard title="Pharmacy Stock" value={stats.totalMedicines} icon={Package} color="white" subtitle={`${stats.lowStockMedicines} Low Alerts`} />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="white" subtitle="Medicine Dispensed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center">
            <Activity className="mr-2 text-blue-600" size={20} /> 
            Live Occupancy Status
          </h3>
          <div className="h-[300px] w-full">
            {occupancyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%" cy="50%" 
                    innerRadius={80} outerRadius={100} 
                    paddingAngle={5} dataKey="value"
                  >
                    {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Bed size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No active beds registered</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8">Patient Pipeline</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Discharged', count: stats.pastBookings },
                { name: 'Admitted', count: stats.activeBookings },
                { name: 'Expected', count: stats.futureBookings },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[10, 10, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS PREVIEW */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">Recent Orders</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Snapshot of distribution</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Quick Search..."
                className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 w-64"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-inner">
              <button 
                onClick={() => setOrderFilter('today')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${orderFilter === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >Today</button>
              <button 
                onClick={() => setOrderFilter('all')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${orderFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >All</button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient & Bed</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No matching records</td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-black text-slate-900 text-sm">{(order as any).Patient?.p_name || 'Anonymous'}</p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase">Unit: {order.bed_number || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <Pill size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-700 text-sm">{order.medicine?.medicine_name || 'Generic Item'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-[10px]">x{order.ordered_quantity}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-slate-500 space-x-2">
                      <Clock size={14} />
                      <span className="text-[11px] font-bold">{new Date(order.order_date).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Dispensed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Help with missing icon
const Pill = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>
  </svg>
);

export default Dashboard;
