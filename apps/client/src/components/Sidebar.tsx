import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Briefcase,
  Upload,
  Users,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useClerk } from '@clerk/clerk-react';
import { useState } from 'react';

export const Sidebar = () => {
  const { signOut } = useClerk();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/upload', icon: Upload, label: 'Upload Resumes' },
    { to: '/matches', icon: Users, label: 'Matches' },
  ];

  return (
    <aside
      className={cn(
        'bg-card border-r border-border transition-all duration-300 flex flex-col h-screen',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold text-primary">HireIQ</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              collapsed ? 'justify-center' : ''
            )}
            activeClassName="bg-primary text-primary-foreground font-medium"
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className={cn(
            'w-full justify-start gap-3',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
};
