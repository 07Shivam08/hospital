
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Bed as BedType, Room } from '../types';
import { Plus, Search, Filter, Image as ImageIcon, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<BedType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // High-quality hospital bed placeholder
  const BED_PLACEHOLDER = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: roomsData } = await supabase.from('Room').select('*').order('room_number');
    const { data: bedsData } = await supabase.from('Bed').select('*').order('bed_number');
    
    setRooms(roomsData || []);
    setBeds(bedsData || []);
    setLoading(false);
  };

  const updateBedStatus = async (bedId: string, newStatus: string) => {
    // Send status as uppercase to match your database schema ('AVAILABLE', 'OCCUPIED', etc.)
    const statusToUpdate = newStatus.toUpperCase();
    const { error } = await supabase
      .from('Bed')
      .update({ status: statusToUpdate })
      .eq('bed_id', bedId);
    
    if (!error) {
      setBeds(prev => prev.map(b => b.bed_id === bedId ? { ...b, status: statusToUpdate as any } : b));
    }
  };

  const deleteBed = async (bedId: string) => {
    if (confirm('Permanently delete this bed record?')) {
      const { error } = await supabase.from('Bed').delete().eq('bed_id', bedId);
      if (!error) fetchData();
    }
  };

  const filteredBeds = beds.filter(bed => {
    const bedStatus = (bed.status || '').toLowerCase();
    const activeFilter = filterStatus.toLowerCase();
    
    const matchesStatus = activeFilter === 'all' || bedStatus === activeFilter;
    const matchesRoom = !selectedRoomId || bed.room_id === selectedRoomId;
    const matchesSearch = bed.bed_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (bed.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesRoom && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
              type="text" 
              placeholder="Search Bed #"
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 w-48 text-slate-900 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none"
            onChange={(e) => setSelectedRoomId(e.target.value || null)}
          >
            <option value="">All Rooms</option>
            {rooms.map(room => (
              <option key={room.room_id} value={room.room_id}>Room {room.room_number}</option>
            ))}
          </select>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter size={16} className="text-slate-400 mr-2" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Under Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-blue-100 transition-all">
          <Plus size={18} />
          <span>New Bed Unit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-4 animate-pulse">
              <div className="w-full h-40 bg-slate-100 rounded-2xl mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div>
            </div>
          ))
        ) : filteredBeds.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white border border-dashed border-slate-300 rounded-[40px]">
            <ImageIcon size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">No matching units</p>
          </div>
        ) : (
          filteredBeds.map(bed => {
            const statusLower = (bed.status || '').toLowerCase();
            return (
              <div key={bed.bed_id} className="bg-white border border-slate-200 rounded-[32px] overflow-hidden group hover:shadow-2xl transition-all duration-500 relative">
                <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={bed.image_url || BED_PLACEHOLDER} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt="Hospital Bed"
                  />
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                    statusLower === 'available' ? 'bg-emerald-500 text-white' :
                    statusLower === 'occupied' ? 'bg-blue-600 text-white' :
                    'bg-rose-600 text-white'
                  }`}>
                    {bed.status}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-black text-slate-900 text-lg leading-none">Unit {bed.bed_number}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Room {bed.room_number}</p>
                    </div>
                    <button 
                      onClick={() => deleteBed(bed.bed_id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 mb-6 min-h-[60px] flex items-center">
                    {bed.patient_name ? (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Patient</p>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{bed.patient_name}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-300 italic uppercase">Unoccupied</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => updateBedStatus(bed.bed_id, 'AVAILABLE')}
                      className={`p-3 rounded-2xl flex items-center justify-center transition-all ${statusLower === 'available' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50'}`}
                    ><CheckCircle size={20} /></button>
                    <button 
                      onClick={() => updateBedStatus(bed.bed_id, 'OCCUPIED')}
                      className={`p-3 rounded-2xl flex items-center justify-center transition-all ${statusLower === 'occupied' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-blue-50'}`}
                    ><Clock size={20} /></button>
                    <button 
                      onClick={() => updateBedStatus(bed.bed_id, 'UNDER MAINTENANCE')}
                      className={`p-3 rounded-2xl flex items-center justify-center transition-all ${statusLower === 'under maintenance' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-rose-50'}`}
                    ><AlertCircle size={20} /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RoomManagement;
