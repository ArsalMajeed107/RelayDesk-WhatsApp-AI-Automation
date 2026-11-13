export type ConversationMode = 'ai' | 'human' | 'resolved';

export type MessageSender = 'customer' | 'ai' | 'agent' | 'system';

export interface ToolActionLog {
  id: string;
  toolName: string;
  summary: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  toolActions?: ToolActionLog[];
}

export interface Conversation {
  id: string;
  customerName: string;
  phone: string;
  avatarUrl: string;
  mode: ConversationMode;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  intent: string;
  handoffReason?: string;
  assignedAgent?: string;
  aiAutoReplyEnabled: boolean;
  messages: Message[];
}

export type OrderStatus =
  | 'Processing'
  | 'Packed'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  items: string;
  totalAmount: number;
  status: OrderStatus;
  trackingCode: string;
  eta: string;
  updatedAt: string;
}

export type AppointmentStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  bookingCode: string;
  customerName: string;
  phone: string;
  service: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
}

export type LeadStatus = 'New' | 'Qualified' | 'Contacted' | 'Converted';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  interest: string;
  consentGiven: boolean;
  consentTimestamp: string;
  source: string;
  status: LeadStatus;
  notes: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  active: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: 'keyword' | 'intent' | 'after_hours' | 'escalation';
  triggerValue: string;
  actionSummary: string;
  enabled: boolean;
  executionsCount: number;
}

export interface BusinessSettings {
  businessName: string;
  whatsappDisplayPhone: string;
  timezone: string;
  alwaysAvailable247: boolean;
  globalAutoReply: boolean;
  afterHoursMessage: string;
  tone: 'Warm & Concise' | 'Formal Enterprise' | 'Friendly Retail';
  handoffThreshold: string;
  operatingHours: string;
  agentName: string;
  agentAvatarUrl: string;
}

export interface WebhookLog {
  id: string;
  direction: 'inbound' | 'outbound';
  eventType: string;
  phone: string;
  summary: string;
  payloadPreview: string;
  timestamp: string;
  status: 'ok' | 'error';
}

export interface WorkspaceState {
  conversations: Conversation[];
  orders: Order[];
  appointments: Appointment[];
  leads: Lead[];
  faqs: FaqItem[];
  rules: AutomationRule[];
  settings: BusinessSettings;
  webhookLogs: WebhookLog[];
}
