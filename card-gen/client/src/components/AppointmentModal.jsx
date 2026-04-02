import React from 'react';
import { X } from 'lucide-react';
import { createAppointment } from '../api/appointments.js';

const AppointmentModal = ({ isOpen, onClose, cardId, defaultName = '', defaultEmail = '', defaultPhone = '', defaultMessage = '', onSuccess }) => {
  const [name, setName] = React.useState(defaultName);
  const [email, setEmail] = React.useState(defaultEmail);
  const [phone, setPhone] = React.useState(defaultPhone);
  const [message, setMessage] = React.useState(defaultMessage);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName(defaultName || '');
      setEmail(defaultEmail || '');
      setPhone(defaultPhone || '');
      setMessage(defaultMessage || '');
    }
  }, [isOpen, defaultName, defaultEmail, defaultPhone, defaultMessage]);

  if (!isOpen) return null;

  // If no cardId, show a message instead of the form
  if (!cardId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl w-[90%] max-w-sm p-5 relative">
          <button className="absolute top-3 right-3 text-gray-500" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold mb-3">Book Appointment</h3>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">This card is in preview mode. Please save the card first to enable appointment booking.</p>
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log('AppointmentModal - cardId:', cardId);
    if (!cardId) {
      alert('Card ID not found. This might be a preview mode. Please save the card first or try again later.');
      return;
    }
    if (!name || !email || !phone || !message) {
      alert('Please fill in name, email, phone number, and message.');
      return;
    }
    try {
      setSubmitting(true);
      await createAppointment({ cardId, name, email, phone, message });
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      alert(err?.message || 'Failed to submit appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[90%] max-w-sm p-5 relative">
        <button className="absolute top-3 right-3 text-gray-500" onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold mb-3">Book Appointment</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="+91 90000 00000" />
          </div>
          <div>
            <label className="block text-sm mb-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Tell us briefly about your requirement" />
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;


