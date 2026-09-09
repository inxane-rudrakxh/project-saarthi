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
  { to: '/assistant', label: 'Assistant', icon: MessageSquare },
  { to: '/about', label: 'About', icon: Info },
];

export default function Layout() {
  const { alerts, projects } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const criticalCount = alerts.filter((a) => a.level === 'CRITICAL' || a.level === 'HIGH').length;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f9fb]">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0f4c5c] flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">ProjectSaarthi</h1>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-gray-900/50 transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 md:w-60 shrink-0 bg-white border-r border-gray-200/80 flex flex-col transition-transform duration-200 ease-in-out`}
      >
        <div className="px-5 py-5 border-b border-gray-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0f4c5c] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">ProjectSaarthi</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">AI Monitoring</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#0f4c5c] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={2} />
              <span>{label}</span>
              {to === '/alerts' && criticalCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {criticalCount}
                </span>
              )}
              {to === '/projects' && projects.length > 0 && (
                <span className="ml-auto text-[10px] font-medium text-gray-400">
                  {projects.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-200/80">
          <div className="text-[10px] text-gray-400 font-medium leading-relaxed">
            Data refreshed from<br />Central Monitoring System
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-medium">Live</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
