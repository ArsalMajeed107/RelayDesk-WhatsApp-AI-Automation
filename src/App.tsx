import { useCallback, useEffect, useState } from 'react';
import { CloudApiView } from './components/CloudApiView';
import { InboxView } from './components/InboxView';
import { KnowledgeRulesView } from './components/KnowledgeRulesView';
import { LeadsView } from './components/LeadsView';
import { NewConversationModal } from './components/NewConversationModal';
import { OrdersBookingsView } from './components/OrdersBookingsView';
import { Sidebar, type WorkspaceTab } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import type {
  Appointment,
  AutomationRule,
  BusinessSettings,
  Conversation,
  FaqItem,
  Lead,
  Order,
  WorkspaceState,
} from './types';

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export default function App() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('inbox');
  const [selectedConversationId, setSelectedConversationId] = useState('conv-1');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const data = await apiJson<WorkspaceState>('/api/state');
      setState(data);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to connect to workspace server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleCreateConversation = async (payload: {
    customerName: string;
    phone: string;
    initialMessage: string;
  }) => {
    setCreatingChat(true);
    try {
      const res = await apiJson<{ conversationId: string; state: WorkspaceState }>(
        '/api/conversations',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      setState(res.state);
      setSelectedConversationId(res.conversationId);
      setActiveTab('inbox');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleSimulateCustomer = async (conversationId: string, text: string) => {
    const res = await apiJson<{ state: WorkspaceState }>(
      `/api/conversations/${conversationId}/simulate-customer`,
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      }
    );
    setState(res.state);
  };

  const handleAgentReply = async (conversationId: string, text: string) => {
    const res = await apiJson<{ state: WorkspaceState }>(
      `/api/conversations/${conversationId}/agent-reply`,
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      }
    );
    setState(res.state);
  };

  const handleUpdateConversation = async (
    conversationId: string,
    patch: Partial<Conversation>
  ) => {
    const res = await apiJson<{ state: WorkspaceState }>(
      `/api/conversations/${conversationId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    );
    setState(res.state);
  };

  const handleGenerateDraft = async (conversationId: string) => {
    const res = await apiJson<{ draft: string }>(
      `/api/conversations/${conversationId}/ai-draft`,
      { method: 'POST' }
    );
    return res.draft;
  };

  const handleUpdateOrder = async (id: string, patch: Partial<Order>) => {
    const res = await apiJson<{ state: WorkspaceState }>(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setState(res.state);
  };

  const handleCreateOrder = async (payload: Partial<Order>) => {
    const res = await apiJson<{ state: WorkspaceState }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setState(res.state);
  };

  const handleUpdateAppointment = async (id: string, patch: Partial<Appointment>) => {
    const res = await apiJson<{ state: WorkspaceState }>(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setState(res.state);
  };

  const handleCreateAppointment = async (payload: Partial<Appointment>) => {
    const res = await apiJson<{ state: WorkspaceState }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setState(res.state);
  };

  const handleUpdateLead = async (id: string, patch: Partial<Lead>) => {
    const res = await apiJson<{ state: WorkspaceState }>(`/api/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setState(res.state);
  };

  const handleUpdateSettings = async (patch: Partial<BusinessSettings>) => {
    const res = await apiJson<{ state: WorkspaceState }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setState(res.state);
  };

  const handleCreateFaq = async (payload: Partial<FaqItem>) => {
    const res = await apiJson<{ state: WorkspaceState }>('/api/faqs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setState(res.state);
  };

  const handleUpdateFaq = async (id: string, patch: Partial<FaqItem>) => {
    const res = await apiJson<{ state: WorkspaceState }>(`/api/faqs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setState(res.state);
  };

  const handleDeleteFaq = async (id: string) => {
    const res = await apiJson<{ state: WorkspaceState }>(`/api/faqs/${id}`, {
      method: 'DELETE',
    });
    setState(res.state);
  };

  const handleCreateRule = async (payload: Partial<AutomationRule>) => {
    const res = await apiJson<{ state: WorkspaceState }>('/api/rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setState(res.state);
  };

  const handleUpdateRule = async (id: string, patch: Partial<AutomationRule>) => {
    const res = await apiJson<{ state: WorkspaceState }>(`/api/rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setState(res.state);
  };

  const handleDeleteRule = async (id: string) => {
    const res = await apiJson<{ state: WorkspaceState }>(`/api/rules/${id}`, {
      method: 'DELETE',
    });
    setState(res.state);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="font-display text-base font-semibold text-slate-900">RelayDesk</p>
          <p className="text-sm text-slate-500">Loading WhatsApp AI workspace...</p>
        </div>
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h1 className="font-display text-base font-semibold text-slate-900">
            Workspace Connection Unavailable
          </h1>
          <p className="text-sm text-slate-600">{loadError || 'Unable to load workspace state.'}</p>
          <button
            type="button"
            onClick={fetchState}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const unreadInboxCount = state.conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const handoffCount = state.conversations.filter((c) => c.mode === 'human').length;

  return (
    <div className="h-screen w-screen flex bg-slate-50 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadInboxCount={unreadInboxCount}
        handoffCount={handoffCount}
        agentName={state.settings.agentName}
        agentAvatarUrl={state.settings.agentAvatarUrl}
        businessName={state.settings.businessName}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <TopHeader
          activeTab={activeTab}
          onOpenNewChat={() => setNewChatOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {activeTab === 'inbox' && (
          <InboxView
            state={state}
            selectedId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            onSimulateCustomer={handleSimulateCustomer}
            onAgentReply={handleAgentReply}
            onUpdateConversation={handleUpdateConversation}
            onGenerateDraft={handleGenerateDraft}
          />
        )}

        {activeTab === 'operations' && (
          <OrdersBookingsView
            state={state}
            onUpdateOrder={handleUpdateOrder}
            onCreateOrder={handleCreateOrder}
            onUpdateAppointment={handleUpdateAppointment}
            onCreateAppointment={handleCreateAppointment}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsView state={state} onUpdateLead={handleUpdateLead} />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeRulesView
            state={state}
            onUpdateSettings={handleUpdateSettings}
            onCreateFaq={handleCreateFaq}
            onUpdateFaq={handleUpdateFaq}
            onDeleteFaq={handleDeleteFaq}
            onCreateRule={handleCreateRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
          />
        )}

        {activeTab === 'cloud_api' && (
          <CloudApiView
            state={state}
            onRefreshState={setState}
            onOpenThread={(convId) => {
              setSelectedConversationId(convId);
              setActiveTab('inbox');
            }}
          />
        )}
      </div>

      <NewConversationModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onCreate={handleCreateConversation}
        submitting={creatingChat}
      />
    </div>
  );
}
