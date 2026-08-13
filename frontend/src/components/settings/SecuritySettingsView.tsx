import { Shield, Smartphone } from "lucide-react";
import { useState } from "react";
import PairDeviceModal from "./PairDeviceModal";

export default function SecuritySettingsView() {
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 hover:border-indigo-200 transition-colors">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-100">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Multi-Factor Authentication</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Secure your account with TOTP and hardware keys.</p>
          </div>
        </div>

        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Authenticator App</h4>
              <p className="text-xs text-gray-500 mt-0.5">Google Authenticator, Authy, etc.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsPairModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
          >
            Pair Device
          </button>
        </div>
      </div>
      
      <PairDeviceModal isOpen={isPairModalOpen} onClose={() => setIsPairModalOpen(false)} />
    </div>
  );
}
