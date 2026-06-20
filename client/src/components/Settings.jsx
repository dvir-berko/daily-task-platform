import { useEffect, useState } from 'react'
import { getSettings, updateSettings, testWhatsApp } from '../api'

export default function Settings() {
  const [form, setForm] = useState({ whatsapp_to: '', reminder_time: '08:00', reminder_enabled: 'true' })
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => { getSettings().then(s => setForm(f => ({ ...f, ...s }))) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    await updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleTest() {
    setTesting(true); setTestResult(null)
    try {
      const res = await testWhatsApp()
      setTestResult({ ok: true, msg: res.message })
    } catch (err) {
      setTestResult({ ok: false, msg: err.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto pb-6 max-w-xl">
      <h2 className="text-xl font-bold text-white mb-5">Settings</h2>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* WhatsApp */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💬</span>
            <h3 className="font-semibold text-white">WhatsApp Reminders</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Your WhatsApp Number</label>
              <input
                className="input"
                placeholder="+972501234567"
                value={form.whatsapp_to}
                onChange={e => set('whatsapp_to', e.target.value)}
              />
              <p className="text-xs text-gray-600 mt-1">Include country code (e.g. +972 for Israel)</p>
            </div>

            <div>
              <label className="label">Daily Reminder Time</label>
              <input
                className="input"
                type="time"
                value={form.reminder_time}
                onChange={e => set('reminder_time', e.target.value)}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set('reminder_enabled', form.reminder_enabled === 'true' ? 'false' : 'true')}
                className={`w-10 h-6 rounded-full transition-colors relative ${form.reminder_enabled === 'true' ? 'bg-indigo-600' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.reminder_enabled === 'true' ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-sm text-gray-300">Enable daily reminders</span>
            </label>
          </div>

          <div className="border-t border-gray-800 mt-4 pt-4">
            <p className="text-xs text-gray-500 mb-3">
              Powered by <strong className="text-gray-400">Twilio</strong>. Set <code className="bg-gray-800 px-1 rounded text-gray-300">TWILIO_ACCOUNT_SID</code>, <code className="bg-gray-800 px-1 rounded text-gray-300">TWILIO_AUTH_TOKEN</code> in your <code className="bg-gray-800 px-1 rounded text-gray-300">.env</code> file.
            </p>
            <button type="button" onClick={handleTest} disabled={testing} className="btn-ghost text-sm border border-gray-700">
              {testing ? 'Sending...' : '🧪 Send Test Message'}
            </button>
            {testResult && (
              <p className={`text-sm mt-2 ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.ok ? '✓ ' : '✗ '}{testResult.msg}
              </p>
            )}
          </div>
        </div>

        <button type="submit" className="btn-primary">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </form>

      {/* Setup guide */}
      <div className="card p-5 mt-5">
        <h3 className="font-semibold text-white mb-3">🚀 WhatsApp Setup Guide</h3>
        <ol className="text-sm text-gray-400 flex flex-col gap-2 list-decimal list-inside">
          <li>Create a free account at <strong className="text-gray-300">twilio.com</strong></li>
          <li>Enable the <strong className="text-gray-300">WhatsApp Sandbox</strong> in Twilio console</li>
          <li>Send <code className="bg-gray-800 px-1 rounded text-gray-300">join &lt;your-sandbox-code&gt;</code> from your WhatsApp to <strong className="text-gray-300">+1 415 523 8886</strong></li>
          <li>Copy your Account SID &amp; Auth Token to <code className="bg-gray-800 px-1 rounded text-gray-300">server/.env</code></li>
          <li>Enter your phone number above and save</li>
        </ol>
      </div>
    </div>
  )
}
