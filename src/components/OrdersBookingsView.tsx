import { Calendar, Package, Plus, Search, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type {
  Appointment,
  AppointmentStatus,
  Order,
  OrderStatus,
  WorkspaceState,
} from '../types';

interface OrdersBookingsViewProps {
  state: WorkspaceState;
  onUpdateOrder: (id: string, patch: Partial<Order>) => Promise<void>;
  onCreateOrder: (payload: Partial<Order>) => Promise<void>;
  onUpdateAppointment: (id: string, patch: Partial<Appointment>) => Promise<void>;
  onCreateAppointment: (payload: Partial<Appointment>) => Promise<void>;
}

const ORDER_STATUSES: OrderStatus[] = [
  'Processing',
  'Packed',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'Confirmed',
  'Pending',
  'Completed',
  'Cancelled',
];

export function OrdersBookingsView({
  state,
  onUpdateOrder,
  onCreateOrder,
  onUpdateAppointment,
  onCreateAppointment,
}: OrdersBookingsViewProps) {
  const [subTab, setSubTab] = useState<'orders' | 'appointments'>('orders');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Order form state
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderItems, setOrderItems] = useState('');
  const [orderTotal, setOrderTotal] = useState('240');

  // Appointment form state
  const [aptCustomer, setAptCustomer] = useState('');
  const [aptPhone, setAptPhone] = useState('');
  const [aptService, setAptService] = useState('Virtual Interior Styling (30 min)');
  const [aptDate, setAptDate] = useState('2026-11-20');
  const [aptTime, setAptTime] = useState('14:00');
  const [aptNotes, setAptNotes] = useState('');

  const activeOrdersCount = state.orders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length;
  const confirmedBookingsCount = state.appointments.filter(
    (a) => a.status === 'Confirmed' || a.status === 'Pending'
  ).length;
  const activeRulesCount = state.rules.filter((r) => r.enabled).length;

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.orders;
    return state.orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.items.toLowerCase().includes(q) ||
        o.trackingCode.toLowerCase().includes(q)
    );
  }, [state.orders, search]);

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.appointments;
    return state.appointments.filter(
      (a) =>
        a.bookingCode.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.service.toLowerCase().includes(q)
    );
  }, [state.appointments, search]);

  const handleSubmitModal = async (e: FormEvent) => {
    e.preventDefault();
    if (subTab === 'orders') {
      await onCreateOrder({
        customerName: orderCustomer,
        phone: orderPhone,
        items: orderItems,
        totalAmount: Number(orderTotal) || 0,
      });
      setOrderCustomer('');
      setOrderPhone('');
      setOrderItems('');
    } else {
      await onCreateAppointment({
        customerName: aptCustomer,
        phone: aptPhone,
        service: aptService,
        date: aptDate,
        timeSlot: aptTime,
        notes: aptNotes,
      });
      setAptCustomer('');
      setAptPhone('');
      setAptNotes('');
    }
    setModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 4-column summary ledger */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Active Orders</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums mt-1">
            {activeOrdersCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">In processing or transit</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Upcoming Bookings</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums mt-1">
            {confirmedBookingsCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Scheduled consultations</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Consented Leads</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums mt-1">
            {state.leads.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Captured via WhatsApp AI</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Active Automations</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums mt-1">
            {activeRulesCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">24/7 workflows running</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSubTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders ({state.orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('appointments')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'appointments'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments ({state.appointments.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={subTab === 'orders' ? 'Search order # or customer...' : 'Search booking # or service...'}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
            />
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{subTab === 'orders' ? 'New Order' : 'Book Appointment'}</span>
          </button>
        </div>
      </div>

      {/* High-density Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {subTab === 'orders' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Tracking</th>
                  <th className="py-3 px-4">ETA</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No orders match your search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{ord.customerName}</p>
                        <p className="text-xs font-mono tabular-nums text-slate-500">{ord.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{ord.items}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                        ${ord.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {ord.trackingCode}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {ord.eta}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Status for order ${ord.orderNumber}`}
                          value={ord.status}
                          onChange={(e) =>
                            onUpdateOrder(ord.id, { status: e.target.value as OrderStatus })
                          }
                          className="text-xs font-medium px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:border-teal-700 cursor-pointer"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time (PT)</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No appointments match your search.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        #{apt.bookingCode}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{apt.customerName}</p>
                        <p className="text-xs font-mono tabular-nums text-slate-500">{apt.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{apt.service}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {apt.date}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {apt.timeSlot}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {apt.notes || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Status for booking ${apt.bookingCode}`}
                          value={apt.status}
                          onChange={(e) =>
                            onUpdateAppointment(apt.id, {
                              status: e.target.value as AppointmentStatus,
                            })
                          }
                          className="text-xs font-medium px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:border-teal-700 cursor-pointer"
                        >
                          {APPOINTMENT_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Order / Appointment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                {subTab === 'orders' ? 'Create Order Record' : 'Book Consultation'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitModal} className="p-6 space-y-4">
              {subTab === 'orders' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      required
                      type="text"
                      value={orderCustomer}
                      onChange={(e) => setOrderCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      WhatsApp Phone
                    </label>
                    <input
                      required
                      type="text"
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value)}
                      placeholder="+1 (415) 555-0199"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Items
                    </label>
                    <input
                      required
                      type="text"
                      value={orderItems}
                      onChange={(e) => setOrderItems(e.target.value)}
                      placeholder="Oak Sideboard (1)"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Total Amount ($)
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={orderTotal}
                      onChange={(e) => setOrderTotal(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      required
                      type="text"
                      value={aptCustomer}
                      onChange={(e) => setAptCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      WhatsApp Phone
                    </label>
                    <input
                      required
                      type="text"
                      value={aptPhone}
                      onChange={(e) => setAptPhone(e.target.value)}
                      placeholder="+1 (415) 555-0199"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Service
                    </label>
                    <input
                      required
                      type="text"
                      value={aptService}
                      onChange={(e) => setAptService(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Date
                      </label>
                      <input
                        required
                        type="date"
                        value={aptDate}
                        onChange={(e) => setAptDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Time Slot
                      </label>
                      <select
                        value={aptTime}
                        onChange={(e) => setAptTime(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:30">15:30</option>
                        <option value="17:00">17:00</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={aptNotes}
                      onChange={(e) => setAptNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
