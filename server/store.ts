import fs from 'node:fs';
import path from 'node:path';
import type {
  Appointment,
  AutomationRule,
  BusinessSettings,
  Conversation,
  FaqItem,
  Lead,
  Order,
  WebhookLog,
  WorkspaceState,
} from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function createInitialState(): WorkspaceState {
  const now = Date.now();
  const minsAgo = (m: number) => new Date(now - m * 60_000).toISOString();

  const settings: BusinessSettings = {
    businessName: 'Loom & Aura Home',
    whatsappDisplayPhone: '+1 (415) 555-0194',
    timezone: 'America/Los_Angeles',
    alwaysAvailable247: true,
    globalAutoReply: true,
    afterHoursMessage:
      'Thanks for messaging Loom & Aura Home! Our studio team is currently offline, and our AI assistant is capturing your request for immediate morning follow-up.',
    tone: 'Warm & Concise',
    handoffThreshold:
      'Escalate immediately when a customer asks for a human manager, reports damaged merchandise over $150, requests a policy exception refund, or expresses repeated frustration.',
    operatingHours: 'Mon–Sat · 09:00–18:00 PT (24/7 AI Coverage Active)',
    agentName: 'Fxarsal107',
    agentAvatarUrl: '/src/assets/images/avatar_agent_sarah_1794578245976.jpg',
  };

  const orders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: 'ORD-4821',
      customerName: 'Elena Rostova',
      phone: '+1 (415) 890-2314',
      items: 'Kyoto Oak Lounge Chair (1), Boucle Throw Cushion (2)',
      totalAmount: 940,
      status: 'In Transit',
      trackingCode: 'UPS-1Z999AA1019482',
      eta: '2026-11-15',
      updatedAt: minsAgo(48),
    },
    {
      id: 'ord-2',
      orderNumber: 'ORD-4819',
      customerName: 'Priya Nair',
      phone: '+1 (650) 319-4472',
      items: 'Hand-Blown Alabaster Pendant Lamp (1)',
      totalAmount: 385,
      status: 'Delivered',
      trackingCode: 'FDX-7748291048',
      eta: '2026-11-11',
      updatedAt: minsAgo(180),
    },
    {
      id: 'ord-3',
      orderNumber: 'ORD-4815',
      customerName: 'Marcus Chen',
      phone: '+1 (212) 641-8820',
      items: 'Brass Taper Candle Holders — Set of 3',
      totalAmount: 145,
      status: 'Out for Delivery',
      trackingCode: 'UPS-1Z999AA1019310',
      eta: '2026-11-13',
      updatedAt: minsAgo(95),
    },
    {
      id: 'ord-4',
      orderNumber: 'ORD-4808',
      customerName: 'David Thorne',
      phone: '+1 (312) 774-9015',
      items: 'Merino Woven Area Rug 8x10 — Oatmeal',
      totalAmount: 1280,
      status: 'Processing',
      trackingCode: 'PENDING-DISPATCH',
      eta: '2026-11-19',
      updatedAt: minsAgo(420),
    },
  ];

  const appointments: Appointment[] = [
    {
      id: 'apt-1',
      bookingCode: 'APT-209',
      customerName: 'David Thorne',
      phone: '+1 (312) 774-9015',
      service: 'Living Room Material & Rug Consultation',
      date: '2026-11-14',
      timeSlot: '11:00',
      status: 'Confirmed',
      notes: 'Comparing oatmeal vs slate wool samples over video call.',
      createdAt: minsAgo(260),
    },
    {
      id: 'apt-2',
      bookingCode: 'APT-210',
      customerName: 'Elena Rostova',
      phone: '+1 (415) 890-2314',
      service: 'Virtual Interior Styling (30 min)',
      date: '2026-11-16',
      timeSlot: '14:00',
      status: 'Confirmed',
      notes: 'Pairing new Kyoto Oak Lounge Chair with lighting options.',
      createdAt: minsAgo(1440),
    },
    {
      id: 'apt-3',
      bookingCode: 'APT-211',
      customerName: 'Hannah Brooks',
      phone: '+1 (206) 512-7741',
      service: 'Custom Dining Table Sizing Consult',
      date: '2026-11-17',
      timeSlot: '10:00',
      status: 'Pending',
      notes: '8-seat walnut table dimensions for loft apartment.',
      createdAt: minsAgo(2880),
    },
  ];

  const leads: Lead[] = [
    {
      id: 'lead-1',
      name: 'David Thorne',
      phone: '+1 (312) 774-9015',
      email: 'd.thorne@thornearch.com',
      interest: 'Trade program quote for 12-unit boutique hotel lounge',
      consentGiven: true,
      consentTimestamp: minsAgo(255),
      source: 'WhatsApp AI Chat',
      status: 'Qualified',
      notes: 'Explicitly consented to receive trade catalog PDF via email.',
    },
    {
      id: 'lead-2',
      name: 'Claire Bennett',
      phone: '+1 (646) 209-1183',
      email: 'claire.bennett@studio8.co',
      interest: 'Custom walnut dining table — 96 inch',
      consentGiven: true,
      consentTimestamp: minsAgo(1920),
      source: 'WhatsApp AI Chat',
      status: 'Contacted',
      notes: 'Consented to specialist follow-up for custom timber finish.',
    },
  ];

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'Shipping & Delivery',
      question: 'How long does standard and freight furniture shipping take?',
      answer:
        'Small decor ships within 24 hours via UPS/FedEx (2–4 business days). Accent chairs and rugs ship within 3–5 business days with live tracking. Custom walnut dining tables require 3–4 weeks white-glove delivery.',
      active: true,
    },
    {
      id: 'faq-2',
      category: 'Returns & Damage',
      question: 'What is the return and damaged item policy?',
      answer:
        'Unused decor can be returned within 30 days for a full refund. If an item arrives damaged, customers receive a free priority replacement or full refund—orders over $150 with damage photos are escalated to a senior specialist for immediate courier pickup.',
      active: true,
    },
    {
      id: 'faq-3',
      category: 'Consultations',
      question: 'Are virtual interior design consultations free?',
      answer:
        'Yes, 30-minute Virtual Interior Styling and Custom Sizing Consultations are complimentary and available Monday through Saturday at 10:00, 11:00, 14:00, 15:30, and 17:00 PT.',
      active: true,
    },
    {
      id: 'faq-4',
      category: 'Trade & Bulk Orders',
      question: 'Do you offer trade pricing for interior designers and hospitality?',
      answer:
        'Yes! Verified trade partners receive 20% off retail pricing and dedicated project sourcing. We collect name, email, and project scope with explicit consent so our trade desk can send a custom quote.',
      active: true,
    },
  ];

  const rules: AutomationRule[] = [
    {
      id: 'rule-1',
      name: 'Instant Order Status Lookup',
      triggerType: 'intent',
      triggerValue: 'Order tracking, delivery ETA, or ORD-XXXX reference',
      actionSummary: 'Query Orders DB via lookup_order tool and return carrier tracking + ETA',
      enabled: true,
      executionsCount: 142,
    },
    {
      id: 'rule-2',
      name: 'Appointment Slot Verification & Booking',
      triggerType: 'intent',
      triggerValue: 'Book consultation, schedule call, or availability check',
      actionSummary: 'Check open calendar slots via check_available_slots and create booking',
      enabled: true,
      executionsCount: 68,
    },
    {
      id: 'rule-3',
      name: 'Consent-First Lead Capture',
      triggerType: 'intent',
      triggerValue: 'Custom quotes, bulk orders, or trade inquiries',
      actionSummary: 'Ask explicit permission to save contact info, then record via capture_lead',
      enabled: true,
      executionsCount: 39,
    },
    {
      id: 'rule-4',
      name: 'Priority Damage & Refund Escalation',
      triggerType: 'escalation',
      triggerValue: 'Damaged shipment > $150, refund exception, or human agent request',
      actionSummary: 'Pause AI auto-reply and transfer thread to Fxarsal107 via request_human_handoff',
      enabled: true,
      executionsCount: 14,
    },
    {
      id: 'rule-5',
      name: '24/7 Off-Hours Continuity',
      triggerType: 'after_hours',
      triggerValue: 'Incoming WhatsApp message outside 09:00–18:00 PT',
      actionSummary: 'AI handles FAQs, orders, and morning callback booking without delay',
      enabled: true,
      executionsCount: 87,
    },
  ];

  const conversations: Conversation[] = [
    {
      id: 'conv-1',
      customerName: 'Elena Rostova',
      phone: '+1 (415) 890-2314',
      avatarUrl: '/src/assets/images/avatar_customer_elena_1794578246591.jpg',
      mode: 'ai',
      unreadCount: 0,
      lastMessageAt: minsAgo(6),
      lastMessagePreview: 'Your order #ORD-4821 is In Transit via UPS and scheduled to arrive Nov 15.',
      intent: 'Order Tracking',
      aiAutoReplyEnabled: true,
      messages: [
        {
          id: 'msg-101',
          conversationId: 'conv-1',
          sender: 'customer',
          text: 'Hi! Could you check when my Kyoto Oak Lounge Chair (#ORD-4821) will arrive?',
          timestamp: minsAgo(7),
          status: 'read',
        },
        {
          id: 'msg-102',
          conversationId: 'conv-1',
          sender: 'ai',
          text: 'Hi Elena! I checked order #ORD-4821 (Kyoto Oak Lounge Chair + 2 Boucle Throw Cushions). It is currently In Transit via UPS (tracking UPS-1Z999AA1019482) and scheduled to arrive on November 15, 2026. Would you like me to notify you once it is out for delivery?',
          timestamp: minsAgo(6),
          status: 'read',
          toolActions: [
            {
              id: 'ta-1',
              toolName: 'lookup_order',
              summary: 'Looked up Order #ORD-4821 · In Transit (ETA Nov 15)',
              payload: { orderNumber: 'ORD-4821', status: 'In Transit' },
              timestamp: minsAgo(6),
            },
          ],
        },
      ],
    },
    {
      id: 'conv-2',
      customerName: 'Marcus Chen',
      phone: '+1 (212) 641-8820',
      avatarUrl: '/src/assets/images/avatar_customer_marcus_1794578247030.jpg',
      mode: 'ai',
      unreadCount: 1,
      lastMessageAt: minsAgo(18),
      lastMessagePreview: 'Do you have any consultation slots open this Friday afternoon for dining table sizing?',
      intent: 'Appointment Booking',
      aiAutoReplyEnabled: true,
      messages: [
        {
          id: 'msg-201',
          conversationId: 'conv-2',
          sender: 'customer',
          text: 'Hello! I am looking at your walnut dining tables for a loft project and also waiting on my candle holder delivery.',
          timestamp: minsAgo(24),
          status: 'read',
        },
        {
          id: 'msg-202',
          conversationId: 'conv-2',
          sender: 'ai',
          text: 'Welcome back, Marcus! Your Brass Taper Candle Holders (#ORD-4815) are Out for Delivery today. For the walnut dining tables, we offer free 30-minute Custom Sizing Consultations—would you like me to check open slots or send trade pricing?',
          timestamp: minsAgo(23),
          status: 'read',
          toolActions: [
            {
              id: 'ta-2',
              toolName: 'lookup_order',
              summary: 'Looked up Order #ORD-4815 · Out for Delivery',
              payload: { orderNumber: 'ORD-4815', status: 'Out for Delivery' },
              timestamp: minsAgo(23),
            },
          ],
        },
        {
          id: 'msg-203',
          conversationId: 'conv-2',
          sender: 'customer',
          text: 'Do you have any consultation slots open this Friday afternoon for dining table sizing?',
          timestamp: minsAgo(18),
          status: 'read',
        },
      ],
    },
    {
      id: 'conv-3',
      customerName: 'Priya Nair',
      phone: '+1 (650) 319-4472',
      avatarUrl: '/src/assets/images/avatar_customer_priya_1794578247090.jpg',
      mode: 'human',
      unreadCount: 1,
      lastMessageAt: minsAgo(12),
      lastMessagePreview: 'The alabaster shade arrived with a hairline crack on the rim. Can a manager approve an expedited replacement?',
      intent: 'Damage Escalation',
      handoffReason: 'Damaged merchandise ($385 > $150 policy threshold) & manager replacement requested',
      assignedAgent: 'Fxarsal107',
      aiAutoReplyEnabled: false,
      messages: [
        {
          id: 'msg-301',
          conversationId: 'conv-3',
          sender: 'customer',
          text: 'Hi, my Alabaster Pendant Lamp (#ORD-4819) was delivered yesterday, but the alabaster shade arrived with a hairline crack on the rim. Can a manager approve an expedited replacement before Friday?',
          timestamp: minsAgo(13),
          status: 'read',
        },
        {
          id: 'msg-302',
          conversationId: 'conv-3',
          sender: 'ai',
          text: 'I am so sorry your Alabaster Pendant Lamp (#ORD-4819) arrived with a crack, Priya. Because this is a high-value item needing expedited replacement approval before Friday, I have escalated your thread directly to Fxarsal107, our Lead Support Specialist. She has your order details and will respond right here shortly.',
          timestamp: minsAgo(12),
          status: 'read',
          toolActions: [
            {
              id: 'ta-3',
              toolName: 'lookup_order',
              summary: 'Verified Order #ORD-4819 ($385 · Delivered)',
              payload: { orderNumber: 'ORD-4819' },
              timestamp: minsAgo(12),
            },
            {
              id: 'ta-4',
              toolName: 'request_human_handoff',
              summary: 'Transferred to Fxarsal107 · Damaged item > $150',
              payload: { reason: 'Damaged merchandise over $150 requiring expedited replacement' },
              timestamp: minsAgo(12),
            },
          ],
        },
      ],
    },
    {
      id: 'conv-4',
      customerName: 'David Thorne',
      phone: '+1 (312) 774-9015',
      avatarUrl: '/src/assets/images/avatar_customer_david_1794578247770.jpg',
      mode: 'resolved',
      unreadCount: 0,
      lastMessageAt: minsAgo(250),
      lastMessagePreview: 'Confirmed! Your consultation is booked for Nov 14 at 11:00 AM PT (#APT-209).',
      intent: 'Lead & Booking',
      aiAutoReplyEnabled: true,
      messages: [
        {
          id: 'msg-401',
          conversationId: 'conv-4',
          sender: 'customer',
          text: 'Yes, please save my email d.thorne@thornearch.com for the 12-unit hotel lounge trade quote, and book me for Nov 14 at 11:00 AM.',
          timestamp: minsAgo(252),
          status: 'read',
        },
        {
          id: 'msg-402',
          conversationId: 'conv-4',
          sender: 'ai',
          text: 'Confirmed! Your Living Room Material & Rug Consultation is booked for November 14, 2026 at 11:00 AM PT (Booking #APT-209). I have also saved your trade inquiry with your consent and queued our catalog PDF for d.thorne@thornearch.com.',
          timestamp: minsAgo(250),
          status: 'read',
          toolActions: [
            {
              id: 'ta-5',
              toolName: 'book_appointment',
              summary: 'Booked #APT-209 · Nov 14 at 11:00 PT',
              payload: { bookingCode: 'APT-209', date: '2026-11-14', timeSlot: '11:00' },
              timestamp: minsAgo(250),
            },
            {
              id: 'ta-6',
              toolName: 'capture_lead',
              summary: 'Saved consented trade lead (d.thorne@thornearch.com)',
              payload: { email: 'd.thorne@thornearch.com', consentGiven: true },
              timestamp: minsAgo(250),
            },
          ],
        },
      ],
    },
  ];

  const webhookLogs: WebhookLog[] = [
    {
      id: 'wh-1',
      direction: 'inbound',
      eventType: 'messages.text',
      phone: '+1 (415) 890-2314',
      summary: 'Elena Rostova: "Hi! Could you check when my Kyoto Oak Lounge Chair (#ORD-4821) will arrive?"',
      payloadPreview: '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messages":[{"from":"14158902314","type":"text"}]}}]}]}',
      timestamp: minsAgo(7),
      status: 'ok',
    },
    {
      id: 'wh-2',
      direction: 'outbound',
      eventType: 'ai.auto_reply',
      phone: '+1 (415) 890-2314',
      summary: 'Dispatched Gemini auto-reply with lookup_order(#ORD-4821) verification',
      payloadPreview: '{"messaging_product":"whatsapp","to":"14158902314","type":"text","status":"delivered"}',
      timestamp: minsAgo(6),
      status: 'ok',
    },
    {
      id: 'wh-3',
      direction: 'outbound',
      eventType: 'handoff.escalated',
      phone: '+1 (650) 319-4472',
      summary: 'Thread escalated to human agent Fxarsal107 (Damaged item > $150)',
      payloadPreview: '{"conversationId":"conv-3","mode":"human","assignedAgent":"Fxarsal107"}',
      timestamp: minsAgo(12),
      status: 'ok',
    },
  ];

  return {
    conversations,
    orders,
    appointments,
    leads,
    faqs,
    rules,
    settings,
    webhookLogs,
  };
}

class Store {
  private state: WorkspaceState;

  constructor() {
    this.state = this.load();
  }

  private load(): WorkspaceState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        return JSON.parse(raw) as WorkspaceState;
      }
    } catch (err) {
      console.error('Failed to read store.json, re-seeding initial state:', err);
    }
    const seeded = createInitialState();
    this.saveState(seeded);
    return seeded;
  }

  private saveState(nextState: WorkspaceState) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(nextState, null, 2), 'utf-8');
    fs.renameSync(tmpPath, STORE_PATH);
  }

  public getState(): WorkspaceState {
    return this.state;
  }

  public save() {
    this.saveState(this.state);
  }

  public update(mutator: (draft: WorkspaceState) => void): WorkspaceState {
    mutator(this.state);
    this.save();
    return this.state;
  }
}

export const store = new Store();
