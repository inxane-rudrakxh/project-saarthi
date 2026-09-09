import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  AlertTriangle,
  MessageSquare,
  Info,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: Building2 },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { to: '/about', label: 'About', icon: Info },
];

export default function Layout() {
  const { alerts, projects } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const criticalCount = alerts.filter((a) => a.level === 'CRITICAL' || a.level === 'HIGH').length;

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc]">
      {/* Gov Official Header Banner */}
      <header className="shrink-0 z-50 flex flex-col">
        <div className="w-full bg-[#0d3f4d] text-white py-1.5 px-4 md:px-8 flex justify-between items-center text-[11px] font-medium tracking-wide">
          <div className="flex items-center gap-3">
            <span className="text-white/90">MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION</span>
            <span className="hidden md:inline text-white/30">|</span>
            <span className="hidden md:inline text-white/70">GOVERNMENT OF INDIA</span>
          </div>
          <div className="flex items-center gap-4 text-white/70">
            <span>SIH 2026 : PS-26103</span>
          </div>
        </div>
        
        {/* Main Application Navbar */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3.5">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded shadow-sm bg-[#0f4c5c] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 leading-none tracking-tight">ProjectSaarthi</h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-1">AI Project Monitor</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0f4c5c] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.1)]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    <span>{label}</span>
                    {to === '/alerts' && criticalCount > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-600 text-white`}>
                        {criticalCount}
                      </span>
                    )}
                    {to === '/projects' && projects.length > 0 && (
                      <span className={`ml-1 text-[10px] font-bold ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                        {projects.length}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-40 bg-gray-900/50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}
        
        {/* Mobile Sidebar */}
        <aside 
          className={`${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:hidden fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out shadow-xl`}
        >
          <div className="px-5 py-5 border-b border-gray-200 flex items-center justify-between bg-[#f8fafc]">
            <span className="font-extrabold text-gray-900 tracking-tight">Navigation</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="p-1.5 -mr-1.5 text-gray-500 hover:bg-gray-200 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0f4c5c] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={2} />
                <span>{label}</span>
                {to === '/alerts' && criticalCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded">
                    {criticalCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="absolute inset-0 bg-[#f8fafc] -z-10" />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
