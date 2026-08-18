import { Building2, Mail, Key, Eye, EyeOff, Send, Save, Server, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { settingsApi, SystemSettings } from "@/api/settings";

export default function GeneralSettingsView() {
  const [formData, setFormData] = useState<SystemSettings>({
    agencyName: "",
    baseCurrency: "Indian Rupee (₹ INR) — Default",
    timezone: "India Standard Time (IST) — UTC+05:30",
    smtpHost: "",
    smtpPort: "Port 587 (TLS / STARTTLS Recommended)",
    smtpUsername: "",
    smtpPassword: "",
    smtpSenderName: "",
    smtpSenderEmail: "",
    transactionalEmailKey: "",
    slackWebhookUrl: "",
    domainRegistrarSecret: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsApi.getGeneralSettings();
        if (res.data) setFormData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await settingsApi.updateGeneralSettings(formData);
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!formData.smtpHost || !formData.smtpUsername || !formData.smtpPassword) {
      setSmtpTestResult({
        success: false,
        message: "Please provide SMTP Host, Username, and Password before testing the connection.",
      });
      return;
    }
    try {
      setIsTestingSmtp(true);
      setSmtpTestResult(null);
      const res = await settingsApi.testSmtpConnection(formData);
      setSmtpTestResult({
        success: true,
        message: res.data?.message || "SMTP connection verified successfully! Mail server is reachable and credentials are valid.",
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to verify SMTP connection. Please check your credentials and server host.";
      setSmtpTestResult({
        success: false,
        message: msg,
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">Loading settings...</div>;

  return (
    <div className="space-y-6">
      
      {/* Card 1: Agency Workspace Details */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 hover:border-indigo-200 transition-colors">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Agency Workspace Details</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Core operational profile and timezone specifications.</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
            Active Workspace
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Agency Display Name</label>
            <input 
              type="text" 
              name="agencyName"
              value={formData.agencyName || ""} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-900 transition-all" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Agency Base Currency</label>
            <select name="baseCurrency" value={formData.baseCurrency || ""} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-900 bg-white transition-all appearance-none pr-8 cursor-pointer relative" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}>
              <option>Indian Rupee (₹ INR) — Default</option>
              <option>US Dollar ($ USD)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Primary Timezone</label>
            <select name="timezone" value={formData.timezone || ""} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-900 bg-white transition-all appearance-none pr-8 cursor-pointer relative" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}>
              <option>India Standard Time (IST) — UTC+05:30</option>
              <option>Eastern Standard Time (EST) — UTC-05:00</option>
            </select>
          </div>
        </div>
      </div>

      {/* Card 2: SMTP Mail Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">SMTP Mail Settings for Renewal Alerts</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Configure outbound SMTP mail server credentials to dispatch client renewal reminders.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-bold">
              <Server className="w-3.5 h-3.5" />
              SMTP Ready
            </div>
          </div>

          <div className="space-y-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">SMTP Server Host</label>
                <input 
                  type="text" 
                  name="smtpHost"
                  value={formData.smtpHost || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-700 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">SMTP Port</label>
                <select name="smtpPort" value={formData.smtpPort || ""} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-900 bg-white transition-all appearance-none pr-8 cursor-pointer relative" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}>
                  <option>Port 587 (TLS / STARTTLS Recommended)</option>
                  <option>Port 465 (SSL)</option>
                  <option>Port 25 (Unsecured)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">SMTP Account Username</label>
                <input 
                  type="text" 
                  name="smtpUsername"
                  value={formData.smtpUsername || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-700 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">SMTP Password / Key</label>
                <div className="relative">
                  <input 
                    type={showSmtpPassword ? "text" : "password"} 
                    name="smtpPassword"
                    value={formData.smtpPassword || ""} 
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-900 transition-all" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    title={showSmtpPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Sender Name</label>
                <input 
                  type="text" 
                  name="smtpSenderName"
                  value={formData.smtpSenderName || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-900 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Sender Email Address</label>
                <input 
                  type="email" 
                  name="smtpSenderEmail"
                  value={formData.smtpSenderEmail || ""} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-700 transition-all" 
                />
              </div>
            </div>

            {/* Test Result Alert */}
            {smtpTestResult && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                smtpTestResult.success 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                {smtpTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{smtpTestResult.success ? "Connection Verified" : "Connection Failed"}</p>
                  <p className="text-xs mt-0.5 text-gray-600">{smtpTestResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <button 
            type="button"
            onClick={handleTestSmtp}
            disabled={isTestingSmtp}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 text-gray-700 rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            {isTestingSmtp ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                Testing Connection...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Test SMTP Connection
              </>
            )}
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save SMTP Configuration"}
          </button>
        </div>
      </div>

      {/* Card 3: API & External Integration Keys */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 border border-orange-100">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">API & External Integration Keys</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Connect third-party webhooks, domain registrars, and transactional API tokens.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold">
              <Lock className="w-3.5 h-3.5" />
              Encrypted Tokens
            </div>
          </div>

          <div className="space-y-5 mb-6">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Transactional Email API Key (SendGrid / Mailgun)</label>
              <input 
                type="password" 
                name="transactionalEmailKey"
                value={formData.transactionalEmailKey || ""} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-wider text-sm text-gray-900 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Slack Channel Alert Webhook URL</label>
              <input 
                type="url" 
                name="slackWebhookUrl"
                value={formData.slackWebhookUrl || ""} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-700 transition-all" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Domain Registrar Auto-Sync API Secret (GoDaddy / Namecheap)</label>
              <input 
                type="password" 
                name="domainRegistrarSecret"
                value={formData.domainRegistrarSecret || ""} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-wider text-sm text-gray-900 transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save API Integration Keys"}
          </button>
        </div>
      </div>

    </div>
  );
}
