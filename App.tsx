
import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import RoomManagement from './pages/RoomManagement';
import BookingManagement from './pages/BookingManagement';
import PatientManagement from './pages/PatientManagement';
import MedicineInventory from './pages/MedicineInventory';
import OrderManagement from './pages/OrderManagement';
import { Menu, X, LogOut, User, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setIsSidebarOpen(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
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
                <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">admin@medisync.com</p>
                <div className="flex items-center justify-end space-x-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                   <p className="text-[10px] font-black text-green-600 uppercase tracking-tighter">Active Session</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
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
