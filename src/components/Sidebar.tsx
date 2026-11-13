import {
  BookOpen,
  CalendarClock,
  Inbox,
  Menu,
  Users,
  Webhook,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';

export type WorkspaceTab = 'inbox' | 'operations' | 'leads' | 'knowledge' | 'cloud_api';

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  unreadInboxCount: number;
  handoffCount: number;
  agentName: string;
  agentAvatarUrl: string;
  businessName: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'operations', label: 'Orders & Bookings', icon: CalendarClock },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'knowledge', label: 'Knowledge & Rules', icon: BookOpen },
  { id: 'cloud_api', label: 'Cloud API & Logs', icon: Webhook },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  unreadInboxCount,
  handoffCount,
  agentName,
  agentAvatarUrl,
  businessName,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-[248px]">
      <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          RelayDesk
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-500 truncate">{businessName}</p>
        <p className="text-xs font-mono text-slate-400 tabular-nums mt-0.5 truncate">
          WhatsApp Business Cloud
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Workspace sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                isActive
                  ? 'bg-teal-50 text-teal-900'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'inbox' && (unreadInboxCount > 0 || handoffCount > 0) && (
                <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                  {unreadInboxCount > 0 ? unreadInboxCount : handoffCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 flex items-center gap-3 shrink-0">
        <Avatar src={agentAvatarUrl} name={agentName} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{agentName}</p>
          <p className="text-xs text-slate-500 truncate">Lead Support Specialist</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 h-full">{navContent}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/35"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{navContent}</div>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-700"
      aria-label="Open navigation menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
