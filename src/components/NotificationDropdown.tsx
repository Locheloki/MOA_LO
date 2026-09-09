import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, FileText, Sparkles, User, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { OJTNotification } from '../types';

interface NotificationDropdownProps {
  notifications: OJTNotification[];
  onNotificationClick: (notification: OJTNotification) => void;
  onMarkAllAsRead: () => void;
  onToggleReadState: (id: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onToggleReadState,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.state === 'Unread').length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return n.state === 'Unread';
    return true;
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (notif: OJTNotification) => {
    if (notif.isPlaceholder || notif.type === 'DEV_PLACEHOLDER') {
      return (
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    }
    if (notif.type === 'HALFWAY_PROGRESS') {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
      );
    }
    if (notif.type === 'MISSING_MOA' || notif.type === 'MISSING_LO') {
      return (
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    if (notif.type === 'PROFILE_REQUEST') {
      return (
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-surface-container border border-glass-stroke text-secondary flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" />
      </div>
    );
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-secondary hover:text-starlight-white hover:bg-surface-container transition-all cursor-pointer focus:outline-none"
        title="OJT Progress Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-primary text-void-black text-[10px] font-mono font-bold rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,84,81,0.6)] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-void-black/95 backdrop-blur-2xl border border-glass-stroke/80 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.85)] z-50 overflow-hidden animate-fade-in print:hidden">
          {/* Header */}
          <div className="p-4 border-b border-glass-stroke/40 flex items-center justify-between bg-surface-container/30">
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-sm text-starlight-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[11px] font-mono text-secondary hover:text-starlight-white flex items-center gap-1 cursor-pointer transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-primary" />
                  Mark read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-secondary hover:text-starlight-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-glass-stroke/30 px-4 pt-2 bg-void-black/40">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-3 font-mono text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'all'
                  ? 'text-starlight-white border-b-2 border-primary'
                  : 'text-secondary hover:text-starlight-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`pb-2 px-3 font-mono text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'unread'
                  ? 'text-starlight-white border-b-2 border-primary'
                  : 'text-secondary hover:text-starlight-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-glass-stroke/20">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onNotificationClick(notif);
                    setIsOpen(false);
                  }}
                  className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                    notif.state === 'Unread'
                      ? 'bg-surface-container/40 hover:bg-surface-container/70'
                      : 'hover:bg-surface-container/30'
                  }`}
                >
                  {getNotificationIcon(notif)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-sans text-xs font-bold text-starlight-white truncate group-hover:text-primary transition-colors">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-mono text-secondary shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-secondary leading-relaxed line-clamp-2 mb-2 font-sans">
                      {notif.message}
                    </p>

                    {notif.actionPayload && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-primary hover:text-starlight-white transition-colors">
                        <span>View Student Profile</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {notif.state === 'Unread' && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleReadState(notif.id);
                      }}
                      className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 shadow-[0_0_6px_rgba(255,84,81,0.8)]"
                      title="Mark as read"
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-secondary text-xs font-sans">
                No {activeTab === 'unread' ? 'unread' : ''} notifications.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
