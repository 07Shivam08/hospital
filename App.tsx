
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import RoomManagement from './pages/RoomManagement';
import BookingManagement from './pages/BookingManagement';
import PatientManagement from './pages/PatientManagement';
import MedicineInventory from './pages/MedicineInventory';
import OrderManagement from './pages/OrderManagement';
import { Session } from '@supabase/supabase-js';
import { Menu, X, LogOut, User, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      // Close sidebar on login/logout
      setIsSidebarOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Medisync...</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'rooms': return <RoomManagement />;
      case 'bookings': return <BookingManagement />;
      case 'patients': return <PatientManagement />;
      case 'medicines': return <MedicineInventory />;
      case 'orders': return <OrderManagement />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar - Desktop & Mobile */}
      <Sidebar 
        activePage={activePage} 
        onPageChange={(page) => {
          setActivePage(page);
          setIsSidebarOpen(false); // Close on mobile navigation
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile Header Overlay */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 md:px-8 md:py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 md:hidden hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
              >
                <Menu size={24} />
              </button>
              <div className="hidden md:block">
                <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">{activePage}</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Hospital Admin Panel</p>
              </div>
              <div className="md:hidden flex items-center gap-2">
                 <div className="p-1.5 bg-blue-600 rounded-lg">
                    <Activity size={18} className="text-white" />
                 </div>
                 <span className="font-black text-slate-900 text-lg">Medisync</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">{session.user.email}</p>
                <div className="flex items-center justify-end space-x-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                   <p className="text-[10px] font-black text-green-600 uppercase tracking-tighter">Active Session</p>
                </div>
              </div>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-2.5 md:px-5 md:py-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm group"
                title="Log Out"
              >
                <LogOut size={20} className="md:hidden" />
                <span className="hidden md:block font-bold text-sm">Log Out</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
