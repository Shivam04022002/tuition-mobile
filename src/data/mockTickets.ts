export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketCategory =
  | 'Payment Issue'
  | 'Refund Request'
  | 'Tutor Issue'
  | 'Teacher Issue'
  | 'Technical Issue'
  | 'Account Issue'
  | 'Lead Unlock Issue'
  | 'Profile Verification'
  | 'Application Issue'
  | 'Other';

export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface MockTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  description: string;
  userName: string;
  userRole: 'Parent' | 'Teacher';
  userEmail: string;
  userPhone: string;
  assignedTo?: string;
  messages: TicketMessage[];
}

export const MOCK_TICKETS: MockTicket[] = [
  {
    id: 'TKT-1001',
    subject: 'Payment deducted but tutor not unlocked',
    category: 'Payment Issue',
    status: 'Open',
    priority: 'High',
    createdAt: '2024-06-01T10:30:00Z',
    updatedAt: '2024-06-01T10:30:00Z',
    description:
      'I paid ₹499 to unlock tutor contact details but the profile still shows locked. Please check.',
    userName: 'Priya Sharma',
    userRole: 'Parent',
    userEmail: 'priya.sharma@example.com',
    userPhone: '+91 98765 43210',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        senderName: 'Priya Sharma',
        message: 'Payment deducted after deduction.',
        timestamp: '2024-06-01T10:30:00Z',
      },
    ],
  },
  {
    id: 'TKT-1002',
    subject: 'Refund not received after 7 days',
    category: 'Refund Request',
    status: 'In Progress',
    priority: 'Medium',
    createdAt: '2024-05-28T14:00:00Z',
    updatedAt: '2024-06-01T09:15:00Z',
    description:
      'I requested a refund on May 28. It has been more than 7 days and I have not received it yet.',
    userName: 'Rahul Verma',
    userRole: 'Parent',
    userEmail: 'rahul.verma@example.com',
    userPhone: '+91 99887 76655',
    assignedTo: 'Support Agent - Ankit',
    messages: [
      {
        id: 'msg-2',
        sender: 'user',
        senderName: 'Rahul Verma',
        message: 'Refund not received yet. Order ID: RZP-20240528.',
        timestamp: '2024-05-28T14:00:00Z',
      },
      {
        id: 'msg-3',
        sender: 'admin',
        senderName: 'Support Agent - Ankit',
        message: 'We have escalated this to our payments team. Please share the UPI transaction ID.',
        timestamp: '2024-06-01T09:15:00Z',
      },
    ],
  },
  {
    id: 'TKT-1003',
    subject: 'Tutor did not show up for demo class',
    category: 'Tutor Issue',
    status: 'Resolved',
    priority: 'High',
    createdAt: '2024-05-25T08:00:00Z',
    updatedAt: '2024-05-27T16:45:00Z',
    description: 'The tutor confirmed the demo class time but never joined.',
    userName: 'Sunita Patel',
    userRole: 'Parent',
    userEmail: 'sunita.patel@example.com',
    userPhone: '+91 90000 11111',
    assignedTo: 'Support Lead - Meena',
    messages: [
      {
        id: 'msg-4',
        sender: 'user',
        senderName: 'Sunita Patel',
        message: 'Tutor did not show up. Very disappointing.',
        timestamp: '2024-05-25T08:00:00Z',
      },
      {
        id: 'msg-5',
        sender: 'admin',
        senderName: 'Support Lead - Meena',
        message: 'We apologize for the experience. We have issued a full refund to your account.',
        timestamp: '2024-05-27T16:45:00Z',
      },
    ],
  },
  {
    id: 'TKT-1004',
    subject: 'Profile verification pending for 2 weeks',
    category: 'Profile Verification',
    status: 'In Progress',
    priority: 'Medium',
    createdAt: '2024-05-20T11:00:00Z',
    updatedAt: '2024-05-30T10:00:00Z',
    description:
      'I uploaded all documents for verification 2 weeks ago but my profile still shows "Pending Verification".',
    userName: 'Arjun Nair',
    userRole: 'Teacher',
    userEmail: 'arjun.nair@example.com',
    userPhone: '+91 88888 22222',
    assignedTo: 'Verification Team',
    messages: [
      {
        id: 'msg-6',
        sender: 'user',
        senderName: 'Arjun Nair',
        message: 'Documents uploaded 2 weeks ago. Still pending.',
        timestamp: '2024-05-20T11:00:00Z',
      },
      {
        id: 'msg-7',
        sender: 'admin',
        senderName: 'Verification Team',
        message: 'We are reviewing your documents. Expected SLA: 3 business days.',
        timestamp: '2024-05-30T10:00:00Z',
      },
    ],
  },
  {
    id: 'TKT-1005',
    subject: 'Cannot unlock leads — payment fails at checkout',
    category: 'Lead Unlock Issue',
    status: 'Open',
    priority: 'Urgent',
    createdAt: '2024-06-02T07:45:00Z',
    updatedAt: '2024-06-02T07:45:00Z',
    description: 'Every time I try to unlock a lead, the Razorpay checkout crashes and throws an error.',
    userName: 'Kavitha Rao',
    userRole: 'Teacher',
    userEmail: 'kavitha.rao@example.com',
    userPhone: '+91 77777 33333',
    messages: [
      {
        id: 'msg-8',
        sender: 'user',
        senderName: 'Kavitha Rao',
        message: 'Checkout screen crashes on every attempt. Please fix urgently.',
        timestamp: '2024-06-02T07:45:00Z',
      },
    ],
  },
  {
    id: 'TKT-1006',
    subject: 'Account locked after OTP failure',
    category: 'Account Issue',
    status: 'Closed',
    priority: 'Low',
    createdAt: '2024-05-15T15:00:00Z',
    updatedAt: '2024-05-16T12:00:00Z',
    description: 'My account got locked after multiple failed OTP attempts.',
    userName: 'Deepak Joshi',
    userRole: 'Parent',
    userEmail: 'deepak.joshi@example.com',
    userPhone: '+91 66666 44444',
    assignedTo: 'Support Agent - Ravi',
    messages: [
      {
        id: 'msg-9',
        sender: 'user',
        senderName: 'Deepak Joshi',
        message: 'Account is locked. Cannot log in.',
        timestamp: '2024-05-15T15:00:00Z',
      },
      {
        id: 'msg-10',
        sender: 'admin',
        senderName: 'Support Agent - Ravi',
        message: 'Account has been unlocked. Please try logging in again.',
        timestamp: '2024-05-16T12:00:00Z',
      },
    ],
  },
];

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  Open: '#F59E0B',
  'In Progress': '#3B82F6',
  Resolved: '#10B981',
  Closed: '#94A3B8',
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  Low: '#10B981',
  Medium: '#3B82F6',
  High: '#F59E0B',
  Urgent: '#EF4444',
};

export const PARENT_TICKET_CATEGORIES: TicketCategory[] = [
  'Payment Issue',
  'Refund Request',
  'Tutor Issue',
  'Technical Issue',
  'Account Issue',
  'Other',
];

export const TEACHER_TICKET_CATEGORIES: TicketCategory[] = [
  'Lead Unlock Issue',
  'Profile Verification',
  'Application Issue',
  'Payment Issue',
  'Technical Issue',
  'Account Issue',
  'Other',
];

export const TICKET_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

let ticketCounter = 1007;
export const generateTicketId = (): string => {
  return `TKT-${ticketCounter++}`;
};
