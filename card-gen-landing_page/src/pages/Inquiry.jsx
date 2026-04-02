import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../lib/api.js';
import { CreditCard, Mail, Phone, Send, CheckCircle, AlertCircle, User } from 'lucide-react';

export default function Inquiry() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [inquiryData, setInquiryData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    businessType: ''
  });

  useEffect(() => {
    const fetchCard = async () => {
      if (!id) {
        setError('Invalid card ID');
        setLoading(false);
        return;
      }

      const response = await apiService.getCardById(id);
      if (response.success && response.data) {
        setCard(response.data);
      } else {
        setError(response.error || 'Card not found');
      }
      setLoading(false);
    };

    fetchCard();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!inquiryData.name || !inquiryData.email || !inquiryData.phone) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    const response = await apiService.submitInquiry(inquiryData);
    
    if (response.success) {
      setSuccess('Your inquiry has been submitted successfully! We will get back to you soon.');
      setInquiryData({
        name: '',
        email: '',
        phone: '',
        message: '',
        businessType: ''
      });
    } else {
      setError(response.error || 'Failed to submit inquiry');
    }
    
    setSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInquiryData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Card Not Found</h1>
            <p className="text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <CreditCard className="w-10 h-10 text-blue-600" />
            <span className="text-3xl font-bold text-slate-800">CardPro</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Business Card Inquiry</h1>
          <p className="text-slate-600 text-lg">Request a custom business card design</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Card Preview */}
          {card && (
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Card Preview</h2>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-8 h-8" />
                  <span className="text-xl font-bold">CardPro</span>
                </div>
                <h3 className="text-3xl font-bold mb-2">{card.name}</h3>
                <p className="text-blue-100 mb-6">{card.business_type}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{card.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{card.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inquiry Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Request Your Card</h2>
            <p className="text-slate-600 mb-6">
              Fill out the form below to request a custom business card design. We'll get back to you within 24 hours.
            </p>

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={inquiryData.name}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={inquiryData.email}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    placeholder="john@example.com"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={inquiryData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    placeholder="+1 (555) 123-4567"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-blue-700 text-sm">
            If you have any questions about our business card services or need assistance with your inquiry, 
            please don't hesitate to contact us directly.
          </p>
        </div>
      </div>
    </div>
  );
}
