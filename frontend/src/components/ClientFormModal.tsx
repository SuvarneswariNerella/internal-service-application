import { useState, useEffect } from "react";
import {
  Building2,
  X,
  Briefcase,
  FileText,
  Building,
  Hash,
  MapPin,
  Globe,
  User,
  Mail,
  ChevronDown,
} from "lucide-react";
import { clientsApi, type Client } from "@/api/clients";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { State, City } from "country-state-city";

const INDUSTRIES = [
  "Technology & SaaS",
  "E-commerce & Retail",
  "Healthcare & Life Sciences",
  "Financial Services",
  "Media & Entertainment",
  "Manufacturing",
  "Real Estate",
  "Education",
  "Logistics & Supply Chain",
  "Hospitality & Tourism",
  "Government & Public Sector",
  "Other",
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "Germany",
  "United Arab Emirates",
];

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", label: "IN +91", name: "India" },
  { code: "+1", flag: "🇺🇸", label: "US +1", name: "United States" },
  { code: "+44", flag: "🇬🇧", label: "UK +44", name: "United Kingdom" },
  { code: "+1", flag: "🇨🇦", label: "CA +1", name: "Canada" },
  { code: "+61", flag: "🇦🇺", label: "AU +61", name: "Australia" },
  { code: "+65", flag: "🇸🇬", label: "SG +65", name: "Singapore" },
  { code: "+49", flag: "🇩🇪", label: "DE +49", name: "Germany" },
  { code: "+971", flag: "🇦🇪", label: "AE +971", name: "United Arab Emirates" },
];

const INDIAN_STATES_DATA = State.getStatesOfCountry("IN");

function FormField({
  label,
  required,
  children,
  className = "",
}: {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
          {label}
          {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function InputBox({
  badge,
  badgeBg = "bg-blue-50/80 text-blue-600 border-blue-100",
  children,
  className = "",
}: {
  badge?: React.ReactNode;
  badgeBg?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center h-[38px] w-full bg-white border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all overflow-hidden ${className}`}
    >
      {badge && (
        <div className={`h-full px-2.5 flex items-center justify-center shrink-0 border-r ${badgeBg}`}>
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  onSuccess?: (updatedClient?: Client) => void;
}

export default function ClientFormModal({
  isOpen,
  onClose,
  client,
  onSuccess,
}: ClientFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const { globalWorkspaceId } = useWorkspaceStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState("+91");

  const [form, setForm] = useState({
    name: "",
    industry: "",
    legalEntityName: "",
    mrr: "",
    gstin: "",
    state: "",
    streetAddress: "",
    city: "",
    postalCode: "",
    country: "India",
    contactPerson: "",
    contactEmail: "",
    billingEmail: "",
    phone: "",
    accountManagerLead: "",
  });

  const [customIndustry, setCustomIndustry] = useState("");
  const [isCustomIndustry, setIsCustomIndustry] = useState(false);

  const [customState, setCustomState] = useState("");
  const [isCustomState, setIsCustomState] = useState(false);

  const [customCity, setCustomCity] = useState("");
  const [isCustomCity, setIsCustomCity] = useState(false);

  const isEdit = !!client;

  useEffect(() => {
    if (client) {
      let code = "+91";
      let rawPhone = client.phone || "";
      const matchedCode = COUNTRY_CODES.find((c) => rawPhone.startsWith(c.code));
      if (matchedCode) {
        code = matchedCode.code;
        rawPhone = rawPhone.replace(matchedCode.code, "").trim();
      }

      const notes = client.notes || "";
      const industryMatch = notes.match(/Industry:\s*(.+)/);
      const legalMatch = notes.match(/Legal Entity:\s*(.+)/);
      const mrrMatch = notes.match(/MRR:\s*₹?(.+)/);
      const gstinMatch = notes.match(/GSTIN:\s*(.+)/);
      const billingEmailMatch = notes.match(/Billing Email:\s*(.+)/);

      const addrParts = (client.address || "").split(",").map((s) => s.trim());

      const rawIndustry = industryMatch?.[1] ? industryMatch[1].trim() : "";
      const isStandardInd = INDUSTRIES.includes(rawIndustry);

      const rawState = client.state || addrParts[1] || "";
      const rawCity = client.city || addrParts[2] || "";
      const rawPincode = client.pincode || addrParts[3] || "";

      const isStandardSt = INDIAN_STATES_DATA.some(s => s.name === rawState);
      let isStandardCity = false;
      if (isStandardSt) {
        const selSt = INDIAN_STATES_DATA.find(s => s.name === rawState);
        const cities = selSt ? City.getCitiesOfState("IN", selSt.isoCode) : [];
        isStandardCity = cities.some(c => c.name === rawCity);
      }

      setForm({
        name: client.name || "",
        industry: isStandardInd ? rawIndustry : rawIndustry ? "Other" : "",
        legalEntityName: legalMatch?.[1] ? legalMatch[1].trim() : client.company || "",
        mrr: client.retainer ? String(client.retainer) : mrrMatch?.[1] ? mrrMatch[1].replace(/[^0-9]/g, "") : "",
        gstin: gstinMatch?.[1] ? gstinMatch[1].trim() : "",
        state: rawState,
        streetAddress: addrParts[0] || "",
        city: rawCity,
        postalCode: rawPincode,
        country: addrParts[4] || "India",
        contactPerson: client.contactPerson || "",
        contactEmail: client.email || "",
        billingEmail: billingEmailMatch?.[1] ? billingEmailMatch[1].trim() : "",
        phone: rawPhone,
        accountManagerLead: client.accountManagerLead || "",
      });

      if (!isStandardInd && rawIndustry) {
        setCustomIndustry(rawIndustry);
        setIsCustomIndustry(true);
      } else {
        setCustomIndustry("");
        setIsCustomIndustry(false);
      }

      if (!isStandardSt && rawState) {
        setCustomState(rawState);
        setIsCustomState(true);
      } else {
        setCustomState("");
        setIsCustomState(false);
      }

      if (!isStandardCity && rawCity) {
        setCustomCity(rawCity);
        setIsCustomCity(true);
      } else {
        setCustomCity("");
        setIsCustomCity(false);
      }

      setCountryCode(code);
    }
  }, [client, isOpen]);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || {
    code: "+91",
    flag: "🇮🇳",
    name: "India",
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contactEmail || !form.mrr) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const fullPhone = form.phone.trim() ? `${countryCode} ${form.phone.trim()}` : "";
      const finalIndustry = (form.industry === "Other" || isCustomIndustry) ? (customIndustry.trim() || "Other") : form.industry;
      const finalState = (form.state === "Other" || isCustomState) ? (customState.trim() || "Other") : form.state;
      const finalCity = (form.city === "Other" || isCustomCity) ? (customCity.trim() || "Other") : form.city;

      const payload = {
        name: form.name,
        company: form.legalEntityName || form.name,
        contactPerson: form.contactPerson,
        email: form.contactEmail,
        phone: fullPhone,
        state: finalState,
        city: finalCity,
        pincode: form.postalCode,
        address: [form.streetAddress, finalState, finalCity, form.postalCode, form.country]
          .filter(Boolean)
          .join(", "),
        status: client?.status || "ACTIVE",
        retainer: form.mrr ? Number(form.mrr) : 0,
        accountManagerLead: form.accountManagerLead,
        workspaceId: globalWorkspaceId !== "all" ? globalWorkspaceId : undefined,
        notes: [
          finalIndustry && `Industry: ${finalIndustry}`,
          form.legalEntityName && `Legal Entity: ${form.legalEntityName}`,
          form.mrr && `MRR: ₹${form.mrr}`,
          form.gstin && `GSTIN: ${form.gstin}`,
          form.billingEmail && `Billing Email: ${form.billingEmail}`,
        ]
          .filter(Boolean)
          .join("\n"),
      };

      if (isEdit && client?.id) {
        const res = await clientsApi.update(client.id, payload);
        if (res.data.success && res.data.data) {
          addToast("Client updated successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      } else {
        const res = await clientsApi.create(payload);
        if (res.data.success && res.data.data) {
          addToast("Client created successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        `Failed to ${isEdit ? "update" : "create"} client`;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-sm overflow-hidden cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[780px] bg-white rounded-xl shadow-2xl p-5 sm:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {isEdit ? "Edit Client" : "Add Client"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {error && (
            <div className="px-3 py-2 rounded-lg border text-xs bg-red-50 border-red-200 text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Row 1: Company / Brand Name & Industry Sector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField label="Company / Brand Name" required>
              <InputBox
                badge={<Building2 className="w-3.5 h-3.5" />}
                badgeBg="bg-blue-50 text-blue-600 border-blue-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter company or brand name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </InputBox>
            </FormField>

            <FormField label="Industry Sector">
              <InputBox
                badge={<Briefcase className="w-3.5 h-3.5" />}
                badgeBg="bg-purple-50 text-purple-600 border-purple-100"
              >
                {form.industry === "Other" || isCustomIndustry ? (
                  <div className="relative flex items-center w-full h-full">
                    <input
                      type="text"
                      className="w-full h-full pl-2.5 pr-7 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                      placeholder="Specify custom industry..."
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomIndustry(false);
                        set("industry", "");
                        setCustomIndustry("");
                      }}
                      className="absolute right-2 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Back to select list"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                      value={form.industry}
                      onChange={(e) => {
                        if (e.target.value === "Other") {
                          set("industry", "Other");
                          setIsCustomIndustry(true);
                        } else {
                          set("industry", e.target.value);
                          setIsCustomIndustry(false);
                          setCustomIndustry("");
                        }
                      }}
                    >
                      <option value="" className="text-gray-400">Select industry sector</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind} className="text-gray-900">{ind}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                  </>
                )}
              </InputBox>
            </FormField>
          </div>

          {/* Row 2: Legal Entity Name & Monthly Retainer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField label="Legal / Billing Entity Name">
              <InputBox
                badge={<FileText className="w-3.5 h-3.5" />}
                badgeBg="bg-purple-50 text-purple-600 border-purple-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter legal entity or billing name"
                  value={form.legalEntityName}
                  onChange={(e) => set("legalEntityName", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Monthly Retainer (MRR)" required>
              <InputBox
                badge={<span className="font-bold text-xs">₹</span>}
                badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter monthly retainer amount"
                  value={form.mrr}
                  onChange={(e) => set("mrr", e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 3: GSTIN & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField label="GSTIN / Tax ID">
              <InputBox
                badge={<span className="font-bold text-xs">%</span>}
                badgeBg="bg-teal-50 text-teal-600 border-teal-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium uppercase"
                  placeholder="Enter GSTIN or Tax ID (Optional)"
                  value={form.gstin}
                  onChange={(e) => set("gstin", e.target.value.toUpperCase())}
                />
              </InputBox>
            </FormField>

            <FormField label="Country">
              <InputBox
                badge={<Globe className="w-3.5 h-3.5" />}
                badgeBg="bg-blue-50 text-blue-600 border-blue-100"
              >
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} className="text-gray-900">{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>
          </div>

          {/* Section: Billing Address */}
          <div className="pt-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Billing Address</span>
            </div>

            <InputBox className="mb-2">
              <input
                type="text"
                className="w-full h-full px-3 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                placeholder="Street Address (e.g. 12th Floor, Trade Tower, Lower Parel)"
                value={form.streetAddress}
                onChange={(e) => set("streetAddress", e.target.value)}
              />
            </InputBox>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. State */}
              <InputBox
                badge={<Building className="w-3.5 h-3.5" />}
                badgeBg="bg-amber-50 text-amber-600 border-amber-100"
              >
                {form.state === "Other" || isCustomState ? (
                  <div className="relative flex items-center w-full h-full">
                    <input
                      type="text"
                      className="w-full h-full pl-2.5 pr-7 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                      placeholder="Enter custom state..."
                      value={customState}
                      onChange={(e) => setCustomState(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomState(false);
                        set("state", "");
                        setCustomState("");
                      }}
                      className="absolute right-2 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Back to select list"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                      value={form.state}
                      onChange={(e) => {
                        if (e.target.value === "Other") {
                          set("state", "Other");
                          setIsCustomState(true);
                          set("city", "Other"); // If custom state, city also defaults to custom
                          setIsCustomCity(true);
                        } else {
                          set("state", e.target.value);
                          setIsCustomState(false);
                          setCustomState("");
                          set("city", "");
                          setIsCustomCity(false);
                          setCustomCity("");
                        }
                      }}
                    >
                      <option value="" className="text-gray-400">Select state</option>
                      {INDIAN_STATES_DATA.map((st) => (
                        <option key={st.isoCode} value={st.name} className="text-gray-900">{st.name}</option>
                      ))}
                      <option value="Other" className="text-gray-900">Other (Custom)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                  </>
                )}
              </InputBox>

              {/* 2. City */}
              <InputBox
                badge={<Building className="w-3.5 h-3.5" />}
                badgeBg="bg-purple-50 text-purple-600 border-purple-100"
              >
                {form.city === "Other" || isCustomCity ? (
                  <div className="relative flex items-center w-full h-full">
                    <input
                      type="text"
                      className="w-full h-full pl-2.5 pr-7 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                      placeholder="Enter custom city..."
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCity(false);
                        set("city", "");
                        setCustomCity("");
                      }}
                      className="absolute right-2 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Back to select list"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium disabled:opacity-50"
                      value={form.city}
                      onChange={(e) => {
                        if (e.target.value === "Other") {
                          set("city", "Other");
                          setIsCustomCity(true);
                        } else {
                          set("city", e.target.value);
                          setIsCustomCity(false);
                          setCustomCity("");
                        }
                      }}
                      disabled={!form.state}
                    >
                      <option value="" className="text-gray-400">Select city</option>
                      {(function() {
                        const selSt = INDIAN_STATES_DATA.find(s => s.name === form.state);
                        return selSt ? City.getCitiesOfState("IN", selSt.isoCode).map((ct) => (
                          <option key={ct.name} value={ct.name} className="text-gray-900">{ct.name}</option>
                        )) : null;
                      })()}
                      {form.state && <option value="Other" className="text-gray-900">Other (Custom)</option>}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                  </>
                )}
              </InputBox>

              {/* 3. Pincode / Postal Code */}
              <InputBox
                badge={<Hash className="w-3.5 h-3.5" />}
                badgeBg="bg-purple-50 text-purple-600 border-purple-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. 400013"
                  value={form.postalCode}
                  onChange={(e) => set("postalCode", e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                />
              </InputBox>
            </div>
          </div>

          {/* Row 4: Primary Contact Person & Contact Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
            <FormField label="Primary Contact Person">
              <InputBox
                badge={<User className="w-3.5 h-3.5" />}
                badgeBg="bg-blue-50 text-blue-600 border-blue-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter full name of the contact person"
                  value={form.contactPerson}
                  onChange={(e) => set("contactPerson", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Contact Email" required>
              <InputBox
                badge={<Mail className="w-3.5 h-3.5" />}
                badgeBg="bg-blue-50 text-blue-600 border-blue-100"
              >
                <input
                  type="email"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter contact email address"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  required
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 5: Billing Email Address & Contact Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField label="Billing Email Address">
              <InputBox
                badge={<Mail className="w-3.5 h-3.5" />}
                badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <input
                  type="email"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter billing email address"
                  value={form.billingEmail}
                  onChange={(e) => set("billingEmail", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Contact Phone Number">
              <InputBox
                badge={
                  <div className="relative flex items-center gap-1 cursor-pointer text-xs font-semibold text-gray-900 select-none">
                    <span className="text-sm">{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500 ml-0.5" />
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs text-gray-900 bg-white"
                      aria-label="Select Country Code"
                    >
                      {COUNTRY_CODES.map((c, idx) => (
                        <option key={`${c.code}-${idx}`} value={c.code} className="text-gray-900 font-medium">
                          {c.flag} {c.code} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                }
                badgeBg="bg-gray-50 text-gray-900 border-gray-200"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/[^0-9\s-]/g, ""))}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 6: Account Manager Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField label="Account Manager Lead">
              <InputBox
                badge={<User className="w-3.5 h-3.5" />}
                badgeBg="bg-blue-50 text-blue-600 border-blue-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter account manager lead"
                  value={form.accountManagerLead}
                  onChange={(e) => set("accountManagerLead", e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-[#0052FF] hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isEdit ? "Saving..." : "Adding..."}
                </span>
              ) : isEdit ? (
                "Edit"
              ) : (
                "Add Client"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
