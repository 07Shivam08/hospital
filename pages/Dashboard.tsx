
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Bed, 
  Users, 
  Package,
  Activity,
  ShoppingCart,
  Search,
  Clock
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Bed as BedType, Medicine, Booking, Order } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    pastBookings: 0,
    activeBookings: 0,
    futureBookings: 0,
    totalMedicines: 0,
    lowStockMedicines: 0,
    totalOrders: 0
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchOrders();
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Bed' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date().toISOString();
      const [bedsRes, medicinesRes, bookingsRes, ordersRes] = await Promise.all([
        supabase.from('Bed').select('*'),
        supabase.from('Medicine').select('*'),
        supabase.from('Booking').select('*'),
        supabase.from('Orders').select('*', { count: 'exact', head: true })
      ]);

      const beds = (bedsRes.data || []) as BedType[];
      const medicines = (medicinesRes.data || []) as Medicine[];
      const bookings = (bookingsRes.data || []) as Booking[];

      setStats({
        totalBeds: beds.length,
        occupiedBeds: beds.filter(b => (b.status || '').toUpperCase() === 'OCCUPIED').length,
        availableBeds: beds.filter(b => (b.status || '').toUpperCase() === 'AVAILABLE').length,
        pastBookings: bookings.filter(b => b.booking_end_date < now).length,
        activeBookings: bookings.filter(b => b.booking_start_date <= now && b.booking_end_date >= now).length,
        futureBookings: bookings.filter(b => b.booking_start_date > now).length,
        totalMedicines: medicines.length,
        lowStockMedicines: medicines.filter(m => m.quantity <= m.threshold_quantity).length,
        totalOrders: ordersRes.count || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('Orders').select('*, Patient(p_name)').order('order_date', { ascending: false }).limit(6);
    setOrders(data || []);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Synchronizing Hospital Systems...</p>
      </div>
    );
  }

  const occupancyData = [
    { name: 'Occupied', value: stats.occupiedBeds, color: '#2563eb' },
    { name: 'Available', value: stats.availableBeds, color: '#10b981' },
    { name: 'Other', value: Math.max(0, stats.totalBeds - stats.occupiedBeds - stats.availableBeds), color: '#f43f5e' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Beds" value={stats.totalBeds} icon={Bed} color="blue" subtitle={`${stats.availableBeds} Ready`} />
        <StatCard title="Active Admissions" value={stats.activeBookings} icon={Users} color="white" subtitle="Live Patients" />
        <StatCard title="Pharmacy Items" value={stats.totalMedicines} icon={Package} color="white" subtitle={`${stats.lowStockMedicines} Alerts`} />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="white" subtitle="Medications Issued" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center">
            <Activity className="mr-2 text-blue-600" size={18} /> Occupancy Analytics
          </h3>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-black text-slate-900 mb-6">Patient Workflow</h3>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Past', count: stats.pastBookings },
                { name: 'Present', count: stats.activeBookings },
                { name: 'Future', count: stats.futureBookings },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: '800', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: '800', fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-600" /> Recent Medication Logs
          </h3>
          <div className="relative w-full sm:w-auto">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search..." 
               className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 w-full sm:w-48"
               value={orderSearch}
               onChange={(e) => setOrderSearch(e.target.value)}
             />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="border-b border-slate-50">
              <tr>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.filter(o => ((o as any).Patient?.p_name || '').toLowerCase().includes(orderSearch.toLowerCase())).map((order) => (
                <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4">
                    <p className="font-black text-slate-900 text-xs">{(order as any).Patient?.p_name || 'Walk-in'}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Unit {order.bed_number || 'OPD'}</p>
                  </td>
                  <td className="py-4">
                    <p className="font-bold text-slate-700 text-xs">{order.medicine?.medicine_name || 'Generic'}</p>
                  </td>
                  <td className="py-4 text-center">
                    <span className="bg-slate-900 text-white px-2 py-0.5 rounded-md font-black text-[10px]">x{order.ordered_quantity}</span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end text-slate-500 gap-1.5">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold uppercase">{new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
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

export default Dashboard;
