import { useState, useEffect } from "react";
import { X, QrCode, CheckCircle2 } from "lucide-react";
import { authApi } from "@/api/auth";
import { useToastStore } from "@/store/toastStore";

interface PairDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PairDeviceModal({ isOpen, onClose }: PairDeviceModalProps) {
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setToken("");
      setIsSuccess(false);
      authApi.generateTotp()
        .then((res) => {
          if (res.data.success && res.data.data) {
            setSecret(res.data.data.secret);
            setQrCodeUrl(res.data.data.qrCodeDataUrl);
          }
        })
        .catch(() => {
          addToast("Failed to generate TOTP. Please try again.", "error");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, addToast]);

  const handleVerify = async () => {
    if (token.length !== 6) {
      addToast("Please enter a valid 6-digit code.", "error");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await authApi.verifyTotp(token, secret);
      if (res.data.success) {
        setIsSuccess(true);
        addToast("Authenticator paired successfully!", "success");
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Invalid verification code. Please try again.";
      addToast(msg, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-2 text-indigo-600">
            <QrCode className="w-5 h-5" />
            <h2 className="text-lg font-black tracking-tight">Pair TOTP Authenticator</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {isSuccess ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Successfully Paired!</h3>
              <p className="text-sm text-gray-500">Your authenticator is now linked to your account.</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 py-8">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p className="text-sm text-gray-500 font-medium">Generating secure TOTP secret...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Scan this QR code with Google Authenticator, Authy, or 1Password to link your mobile device.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5 w-48 h-48 flex items-center justify-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-[#0f172a] rounded-xl flex flex-col items-center justify-center text-white p-3">
                    <span className="font-mono text-[10px] font-bold mb-1.5 tracking-widest">[ QR CODE ]</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 font-mono mb-5">
                Secret Key: <span className="font-bold text-gray-900">{secret}</span>
              </p>
              
              <div className="w-full mb-5">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-bold tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
                />
              </div>

              <button 
                onClick={handleVerify}
                disabled={isVerifying || token.length !== 6}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify & Enable 2FA"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
