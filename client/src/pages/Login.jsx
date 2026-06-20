import { useState } from 'react';
import { api } from '../api';

export default function Login() {
  const [tab, setTab] = useState('google'); // 'google' | 'whatsapp'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleGoogleLogin = (withCalendar = false) => {
    window.location.href = `/api/auth/google${withCalendar ? '?calendar=1' : ''}`;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/whatsapp/send-otp', { phone });
      setSent(true); setStep('code');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { token } = await api.post('/auth/whatsapp/verify-otp', { phone, code });
      localStorage.setItem('jwt', token);
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">DailyTask</h1>
          <p className="text-gray-400 mt-2">Stay organized, stay productive</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setTab('google')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                tab === 'google' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              Google
            </button>
            <button
              onClick={() => setTab('whatsapp')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                tab === 'whatsapp' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              WhatsApp
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google Login */}
          {tab === 'google' && (
            <div className="space-y-3">
              <button
                onClick={() => handleGoogleLogin(false)}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <button
                onClick={() => handleGoogleLogin(true)}
                className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2.5 px-4 rounded-xl transition-colors border border-gray-700">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Continue with Google + Calendar access
              </button>
              <p className="text-gray-500 text-xs text-center pt-2">
                Calendar access lets you sync tasks with Google Calendar
              </p>
            </div>
          )}

          {/* WhatsApp OTP */}
          {tab === 'whatsapp' && (
            <div>
              {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">WhatsApp Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1234567890"
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />
                    <p className="text-gray-500 text-xs mt-1">Include country code (e.g. +972...)</p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    {loading ? <span className="animate-spin">⏳</span> : '📱'}
                    Send OTP via WhatsApp
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="text-green-400 text-sm">✓ Code sent to {phone}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Enter 6-digit code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      required
                      maxLength={6}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors">
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                  <button type="button" onClick={() => { setStep('phone'); setCode(''); setSent(false); }}
                    className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors">
                    ← Try a different number
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By signing in you agree to our terms of service
        </p>
      </div>
    </div>
  );
}