import { MessageSquarePlus } from 'lucide-react';
import { MobileMenuButton, type WorkspaceTab } from './Sidebar';

interface TopHeaderProps {
  activeTab: WorkspaceTab;
  onOpenNewChat: () => void;
  onOpenMobileMenu: () => void;
}

const TAB_TITLES: Record<WorkspaceTab, string> = {
  inbox: 'Inbox & AI Assistant',
  operations: 'Orders & Bookings',
  leads: 'Leads CRM',
  knowledge: 'Knowledge & Rules',
  cloud_api: 'Cloud API & Logs',
};

export function TopHeader({
  activeTab,
  onOpenNewChat,
  onOpenMobileMenu,
}: TopHeaderProps) {
  return (
    <header className="h-14 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenuButton onClick={onOpenMobileMenu} />
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-400 whitespace-nowrap shrink-0 hidden sm:inline">
            Workspace
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <h1 className="font-display text-sm sm:text-base font-semibold text-slate-900 truncate">
            {TAB_TITLES[activeTab]}
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenNewChat}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs sm:text-sm font-medium hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 cursor-pointer"
      >
        <MessageSquarePlus className="w-4 h-4 shrink-0" />
        <span>New Customer Chat</span>
      </button>
    </header>
  );
}
