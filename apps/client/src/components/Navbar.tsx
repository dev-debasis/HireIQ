import React, { useEffect, useState } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Bell } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  read?: boolean;
};

const Navbar: React.FC = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('notifications');
      const parsed = raw ? JSON.parse(raw) : [];
      setNotifications(parsed);
    } catch (e) {
      setNotifications([]);
    }
  }, []);

  const save = (items: NotificationItem[]) => {
    setNotifications(items);
    try {
      localStorage.setItem('notifications', JSON.stringify(items));
    } catch (e) {
      console.log('Failed to save notifications to localStorage', e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    save(updated);
  };

  const clearAll = () => {
    save([]);
  };

  const addTestNotification = () => {
    const n: NotificationItem = {
      id: String(Date.now()),
      title: 'Test notification',
      body: 'This is a test notification.',
      createdAt: new Date().toISOString(),
      read: false,
    };
    save([n, ...notifications]);
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h2 className="text-sm text-muted-foreground">Welcome back,</h2>
        <p className="text-lg font-semibold text-foreground">
          {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1">{unreadCount}</Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Notifications</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={markAllRead}>
                  Mark all
                </Button>
                <Button size="sm" variant="ghost" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-auto">
              {notifications.length === 0 && (
                <div className="text-sm text-muted-foreground">No notifications</div>
              )}

              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-2 rounded-md border ${n.read ? 'bg-muted' : 'bg-card'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={addTestNotification} variant="outline">
                Add test
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-10 h-10',
            },
          }}
        />
      </div>
    </header>
  );
};

export default Navbar;
