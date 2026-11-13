import {
  AlertTriangle,
  Bot,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Package,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Send,
  Sparkles,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Conversation, ConversationMode, WorkspaceState } from '../types';
import { Avatar } from './Avatar';

interface InboxViewProps {
  state: WorkspaceState;
  selectedId: string;
  onSelectConversation: (id: string) => void;
  onSimulateCustomer: (conversationId: string, text: string) => Promise<void>;
  onAgentReply: (conversationId: string, text: string) => Promise<void>;
  onUpdateConversation: (
    conversationId: string,
    patch: Partial<Conversation>
  ) => Promise<void>;
  onGenerateDraft: (conversationId: string) => Promise<string>;
}

function formatShortTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ModeIndicator({ mode }: { mode: ConversationMode }) {
  if (mode === 'human') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 whitespace-nowrap shrink-0">
        <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Human Handoff</span>
      </span>
    );
  }
  if (mode === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Resolved</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 whitespace-nowrap shrink-0">
      <Bot className="w-3.5 h-3.5 text-teal-700 shrink-0" />
      <span>AI Auto-Reply</span>
    </span>
  );
}

const CUSTOMER_QUICK_PROMPTS = [
  'Where is my order #ORD-4821?',
  'Check consultation slots for 2026-11-20',
  'Book 2026-11-20 at 14:00 for Virtual Interior Styling',
  'Yes, please save my email for a trade quote',
  'Please transfer me to a human manager',
];

export function InboxView({
  state,
  selectedId,
  onSelectConversation,
  onSimulateCustomer,
  onAgentReply,
  onUpdateConversation,
  onGenerateDraft,
}: InboxViewProps) {
  const [filterMode, setFilterMode] = useState<'all' | ConversationMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [composerRole, setComposerRole] = useState<'customer' | 'agent'>('customer');
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = useMemo(
    () => state.conversations.find((c) => c.id === selectedId) ?? state.conversations[0],
    [state.conversations, selectedId]
  );

  // Automatically default composer role to human agent when conversation is in human handoff mode
  useEffect(() => {
    if (selectedConversation?.mode === 'human') {
      setComposerRole('agent');
    } else if (selectedConversation?.mode === 'ai') {
      setComposerRole('customer');
    }
    setErrorBanner('');
  }, [selectedConversation?.id, selectedConversation?.mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages.length]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.conversations.filter((conv) => {
      if (filterMode !== 'all' && conv.mode !== filterMode) return false;
      if (!q) return true;
      return (
        conv.customerName.toLowerCase().includes(q) ||
        conv.phone.toLowerCase().includes(q) ||
        conv.lastMessagePreview.toLowerCase().includes(q) ||
        conv.intent.toLowerCase().includes(q)
      );
    });
  }, [state.conversations, filterMode, searchQuery]);

  const linkedOrders = useMemo(() => {
    if (!selectedConversation) return [];
    const digits = selectedConversation.phone.replace(/\D/g, '').slice(-10);
    return state.orders.filter(
      (o) =>
        o.phone.replace(/\D/g, '').slice(-10) === digits ||
        o.customerName.toLowerCase() === selectedConversation.customerName.toLowerCase()
    );
  }, [state.orders, selectedConversation]);

  const linkedAppointments = useMemo(() => {
    if (!selectedConversation) return [];
    const digits = selectedConversation.phone.replace(/\D/g, '').slice(-10);
    return state.appointments.filter(
      (a) =>
        a.phone.replace(/\D/g, '').slice(-10) === digits ||
        a.customerName.toLowerCase() === selectedConversation.customerName.toLowerCase()
    );
  }, [state.appointments, selectedConversation]);

  const linkedLead = useMemo(() => {
    if (!selectedConversation) return undefined;
    const digits = selectedConversation.phone.replace(/\D/g, '').slice(-10);
    return state.leads.find(
      (l) =>
        l.phone.replace(/\D/g, '').slice(-10) === digits ||
        l.name.toLowerCase() === selectedConversation.customerName.toLowerCase()
    );
  }, [state.leads, selectedConversation]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !messageInput.trim() || sending) return;
    const text = messageInput.trim();
    setMessageInput('');
    setErrorBanner('');
    setSending(true);
    try {
      if (composerRole === 'customer') {
        await onSimulateCustomer(selectedConversation.id, text);
      } else {
        await onAgentReply(selectedConversation.id, text);
      }
    } catch (err) {
      setMessageInput(text);
      setErrorBanner(err instanceof Error ? err.message : 'Message delivery failed.');
    } finally {
      setSending(false);
    }
  };

  const handleDraftWithAi = async () => {
    if (!selectedConversation || drafting) return;
    setDrafting(true);
    setErrorBanner('');
    try {
      const draft = await onGenerateDraft(selectedConversation.id);
      if (draft) setMessageInput(draft);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to draft reply.');
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex bg-white overflow-hidden">
      {/* Left Pane: Thread List */}
      <section
        className="w-full md:w-[320px] shrink-0 border-r border-slate-200 flex flex-col min-h-0 bg-white"
        aria-label="Conversation threads"
      >
        <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, intent..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'ai', label: 'AI' },
                { id: 'human', label: 'Handoff' },
                { id: 'resolved', label: 'Closed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700">No matching threads</p>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing your filter or start a simulated WhatsApp chat.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (conv.unreadCount > 0) {
                      onUpdateConversation(conv.id, { unreadCount: 0 });
                    }
                  }}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <Avatar src={conv.avatarUrl} name={conv.customerName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {conv.customerName}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                        {formatShortTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                      <span
                        className={
                          conv.mode === 'human'
                            ? 'text-amber-700 font-medium'
                            : conv.mode === 'ai'
                              ? 'text-teal-700 font-medium'
                              : 'text-slate-500'
                        }
                      >
                        {conv.mode === 'human'
                          ? 'Human Handoff'
                          : conv.mode === 'ai'
                            ? 'AI Active'
                            : 'Resolved'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{conv.intent}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <p className="text-xs text-slate-600 truncate">
                        {conv.lastMessagePreview}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="text-xs font-mono tabular-nums font-semibold text-teal-800 shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Center Pane: Conversation Stream + Dual-Mode Simulator/Agent Composer */}
      {selectedConversation ? (
        <section className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/70">
          {/* Thread Header */}
          <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={selectedConversation.avatarUrl}
                name={selectedConversation.customerName}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-display text-sm sm:text-base font-semibold text-slate-900 truncate">
                    {selectedConversation.customerName}
                  </h2>
                  <ModeIndicator mode={selectedConversation.mode} />
                </div>
                <p className="text-xs font-mono tabular-nums text-slate-500 truncate mt-0.5">
                  {selectedConversation.phone} · {selectedConversation.intent}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedConversation.mode !== 'human' ? (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConversation(selectedConversation.id, {
                      mode: 'human',
                      handoffReason: 'Agent manually took over conversation',
                    })
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Take Over
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConversation(selectedConversation.id, {
                      mode: 'ai',
                      aiAutoReplyEnabled: true,
                    })
                  }
                  className="px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Hand Back to AI
                </button>
              )}

              {selectedConversation.mode !== 'resolved' && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConversation(selectedConversation.id, { mode: 'resolved' })
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer hidden sm:inline-flex"
                >
                  Mark Resolved
                </button>
              )}

              <button
                type="button"
                onClick={() => setInspectorOpen((v) => !v)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 hidden xl:inline-flex cursor-pointer"
                aria-label={inspectorOpen ? 'Hide customer details' : 'Show customer details'}
              >
                {inspectorOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Handoff Reason Banner */}
          {selectedConversation.mode === 'human' && (
            <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs text-amber-900 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="truncate">
                  <strong className="font-semibold">Human Handoff Active:</strong>{' '}
                  {selectedConversation.handoffReason || 'AI auto-reply paused for specialist review.'}
                </span>
              </div>
              <span className="text-xs font-medium text-amber-800 whitespace-nowrap shrink-0">
                Assigned: {selectedConversation.assignedAgent || state.settings.agentName}
              </span>
            </div>
          )}

          {/* Message History */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {selectedConversation.messages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isOutbound = msg.sender === 'ai' || msg.sender === 'agent';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-medium text-slate-500">
                      {msg.sender === 'customer'
                        ? selectedConversation.customerName
                        : msg.sender === 'ai'
                          ? 'Gemini AI Assistant'
                          : state.settings.agentName}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {formatShortTime(msg.timestamp)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[82%] sm:max-w-[70%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.sender === 'customer'
                        ? 'bg-white text-slate-900 border border-slate-200'
                        : msg.sender === 'ai'
                          ? 'bg-teal-900 text-white'
                          : 'bg-slate-900 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {isOutbound && (
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-[11px] text-white/70">
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                  </div>

                  {msg.toolActions && msg.toolActions.length > 0 && (
                    <div className="mt-1.5 space-y-1 max-w-[82%] sm:max-w-[70%]">
                      {msg.toolActions.map((tool) => (
                        <div
                          key={tool.id}
                          className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5"
                        >
                          <Wrench className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span className="font-mono text-[11px] text-slate-500 shrink-0">
                            {tool.toolName}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="truncate">{tool.summary}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {sending && composerRole === 'customer' && (
              <div className="flex items-end flex-col">
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
                  Gemini AI is analyzing intent and checking business records...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div className="mx-5 mb-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3 text-xs text-red-800">
              <span>{errorBanner}</span>
              <button
                type="button"
                onClick={() => setErrorBanner('')}
                className="font-medium underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Interactive Dual-Mode Composer */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setComposerRole('customer')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    composerRole === 'customer'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Simulate Customer (Test AI)
                </button>
                <button
                  type="button"
                  onClick={() => setComposerRole('agent')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    composerRole === 'agent'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Reply as Human Agent
                </button>
              </div>

              {composerRole === 'agent' && (
                <button
                  type="button"
                  onClick={handleDraftWithAi}
                  disabled={drafting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100/70 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{drafting ? 'Drafting...' : 'Draft Reply with AI'}</span>
                </button>
              )}
            </div>

            {composerRole === 'customer' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0 mr-1">
                  Quick test:
                </span>
                {CUSTOMER_QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setMessageInput(prompt)}
                    className="px-2.5 py-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-2.5">
              <textarea
                rows={2}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={
                  composerRole === 'customer'
                    ? `Send an incoming WhatsApp message as ${selectedConversation.customerName}...`
                    : `Write a WhatsApp reply as ${state.settings.agentName}...`
                }
                className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-700 resize-none"
              />
              <button
                type="submit"
                disabled={sending || !messageInput.trim()}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer ${
                  composerRole === 'customer'
                    ? 'bg-teal-700 hover:bg-teal-800'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>{sending ? 'Sending...' : 'Send'}</span>
              </button>
            </form>
          </div>
        </section>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
          Select a conversation to view messages.
        </div>
      )}

      {/* Right Pane: Customer Context Inspector */}
      {selectedConversation && inspectorOpen && (
        <aside className="hidden xl:flex w-[300px] shrink-0 border-l border-slate-200 bg-white flex-col min-h-0 overflow-y-auto">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Customer Context
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <Avatar
                src={selectedConversation.avatarUrl}
                name={selectedConversation.customerName}
                size="lg"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedConversation.customerName}
                </p>
                <p className="text-xs font-mono tabular-nums text-slate-500 truncate mt-0.5">
                  {selectedConversation.phone}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-800">AI Auto-Reply</p>
                <p className="text-[11px] text-slate-500">
                  {selectedConversation.aiAutoReplyEnabled
                    ? 'Responds automatically'
                    : 'Paused for human agent'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={selectedConversation.aiAutoReplyEnabled}
                onClick={() =>
                  onUpdateConversation(selectedConversation.id, {
                    aiAutoReplyEnabled: !selectedConversation.aiAutoReplyEnabled,
                    mode: !selectedConversation.aiAutoReplyEnabled ? 'ai' : 'human',
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  selectedConversation.aiAutoReplyEnabled ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                    selectedConversation.aiAutoReplyEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="p-5 border-b border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Package className="w-4 h-4 text-slate-400" />
              <span>Linked Orders ({linkedOrders.length})</span>
            </div>
            {linkedOrders.length === 0 ? (
              <p className="text-xs text-slate-500">No orders matched to this phone number.</p>
            ) : (
              <div className="space-y-3">
                {linkedOrders.map((ord) => (
                  <div key={ord.id} className="text-xs space-y-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between font-medium text-slate-900">
                      <span className="font-mono tabular-nums">#{ord.orderNumber}</span>
                      <span className="font-mono tabular-nums">${ord.totalAmount}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{ord.items}</p>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {ord.status} · ETA {ord.eta}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 border-b border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Appointments ({linkedAppointments.length})</span>
            </div>
            {linkedAppointments.length === 0 ? (
              <p className="text-xs text-slate-500">No scheduled consultations yet.</p>
            ) : (
              <div className="space-y-3">
                {linkedAppointments.map((apt) => (
                  <div key={apt.id} className="text-xs space-y-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between font-medium text-slate-900">
                      <span className="font-mono tabular-nums">#{apt.bookingCode}</span>
                      <span>{apt.status}</span>
                    </div>
                    <p className="text-slate-600">{apt.service}</p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-500">
                      {apt.date} · {apt.timeSlot} PT
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 space-y-2">
            <h4 className="text-xs font-semibold text-slate-700">Lead & Consent</h4>
            {linkedLead ? (
              <div className="text-xs space-y-1">
                <p className="text-slate-900 font-medium">{linkedLead.email}</p>
                <p className="text-slate-600">{linkedLead.interest}</p>
                <p className="text-[11px] text-teal-800">
                  Consent recorded · {linkedLead.status}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No lead captured yet. AI will request explicit consent before saving inquiry details.
              </p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
