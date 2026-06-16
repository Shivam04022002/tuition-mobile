export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  faqs: FaqItem[];
}

export const MOCK_FAQS: FaqCategory[] = [
  {
    id: 'payments',
    label: 'Payments',
    icon: 'card-outline',
    color: '#2D0A7D',
    faqs: [
      {
        id: 'pay-1',
        question: 'How do I unlock a tutor contact?',
        answer:
          'Complete the payment on the tutor profile page. Once payment is confirmed, the tutor\'s phone number and email become available immediately in your dashboard.',
      },
      {
        id: 'pay-2',
        question: 'What payment methods are accepted?',
        answer:
          'We accept UPI, Credit/Debit Cards, Net Banking, and Wallets via Razorpay. All transactions are secured with 128-bit SSL encryption.',
      },
      {
        id: 'pay-3',
        question: 'Will I receive a payment receipt?',
        answer:
          'Yes. An invoice with GST breakdown (CGST + SGST) is automatically generated and available under your Payment History section within minutes of a successful transaction.',
      },
      {
        id: 'pay-4',
        question: 'My payment was deducted but the tutor is still locked. What should I do?',
        answer:
          'This can happen due to a network timeout. Please wait 10 minutes and refresh the app. If the issue persists, raise a support ticket with your transaction ID and we will resolve it within 24 hours.',
      },
    ],
  },
  {
    id: 'refunds',
    label: 'Refunds',
    icon: 'refresh-outline',
    color: '#F59E0B',
    faqs: [
      {
        id: 'ref-1',
        question: 'What is the refund policy?',
        answer:
          'Refunds are available within 7 days of payment if the tutor was unresponsive or if there was a technical error. Once a tutor has been contacted, the unlock fee is non-refundable.',
      },
      {
        id: 'ref-2',
        question: 'How do I request a refund?',
        answer:
          'Go to My Tickets → Raise Ticket → Select "Refund Request". Provide your transaction ID and reason. Our team will process the refund within 5–7 business days.',
      },
      {
        id: 'ref-3',
        question: 'How long does a refund take?',
        answer:
          'Approved refunds are credited back to the original payment method within 5–7 business days. UPI refunds are typically faster (1–2 days).',
      },
    ],
  },
  {
    id: 'tutor_matching',
    label: 'Tutor Matching',
    icon: 'people-outline',
    color: '#7B2FF7',
    faqs: [
      {
        id: 'match-1',
        question: 'How does tutor matching work?',
        answer:
          'Our algorithm matches tutors based on subject expertise, location preference, budget, and availability. You can also browse and filter tutors manually.',
      },
      {
        id: 'match-2',
        question: 'Can I see tutor ratings before unlocking?',
        answer:
          'Yes. Tutor profiles display verified ratings, subjects taught, teaching experience, and a brief bio before you pay to unlock contact details.',
      },
      {
        id: 'match-3',
        question: 'What if I am not satisfied with the matched tutor?',
        answer:
          'You can browse more tutors and unlock additional profiles. If a matched tutor is unresponsive or problematic, contact support for assistance.',
      },
    ],
  },
  {
    id: 'demo_classes',
    label: 'Demo Classes',
    icon: 'videocam-outline',
    color: '#10B981',
    faqs: [
      {
        id: 'demo-1',
        question: 'How do I schedule a demo class?',
        answer:
          'After unlocking a tutor\'s contact, reach out to them directly to schedule a demo. Demo class arrangements are made between you and the tutor.',
      },
      {
        id: 'demo-2',
        question: 'Is the demo class free?',
        answer:
          'Demo class terms vary by tutor. Many tutors offer a free first demo session. You can confirm this with the tutor directly after unlocking their contact.',
      },
      {
        id: 'demo-3',
        question: 'What if the tutor does not show up for the demo?',
        answer:
          'If a tutor you paid to unlock is unresponsive or fails to conduct the demo, you are eligible for a refund. Raise a support ticket within 7 days.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: 'person-circle-outline',
    color: '#3B82F6',
    faqs: [
      {
        id: 'acc-1',
        question: 'How do I update my profile?',
        answer:
          'Go to Profile → Edit Profile. You can update your name, contact information, address, and child details. Changes are saved immediately.',
      },
      {
        id: 'acc-2',
        question: 'I forgot my password. How do I reset it?',
        answer:
          'On the login screen, tap "Forgot Password" and enter your registered mobile number. You will receive an OTP to reset your password.',
      },
      {
        id: 'acc-3',
        question: 'How do I delete my account?',
        answer:
          'To delete your account, contact support via email at support@tuitionapp.in with your registered mobile number. Account deletion is processed within 30 days.',
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: 'shield-checkmark-outline',
    color: '#EC4899',
    faqs: [
      {
        id: 'priv-1',
        question: 'Is my personal data secure?',
        answer:
          'Yes. We use industry-standard encryption and do not share your personal data with third parties. We comply with applicable data protection regulations.',
      },
      {
        id: 'priv-2',
        question: 'Can tutors see my contact details without payment?',
        answer:
          'No. Your phone number and email are never visible to tutors unless you explicitly choose to share them. All communication is at your discretion.',
      },
      {
        id: 'priv-3',
        question: 'How do I opt out of promotional messages?',
        answer:
          'Go to Profile → Settings → Notifications and toggle off "Promotional Notifications". You can re-enable them at any time.',
      },
    ],
  },
];
