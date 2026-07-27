import { useState, useRef, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoImg from "@/imports/729992358_122093591751385044_3796083363275797365_n.jpg";
import headerImg from "@/imports/La_Craux_Gform_Image_Header.png";
import { submitApplication } from "@/lib/submitApplication";
import { deleteApplication } from "@/lib/deleteApplication";
import { fetchApplications, type Candidate } from "@/lib/fetchApplications";
import {
  ChevronRight, ChevronLeft, Upload, Link2, Bell, Search,
  User, FileText, Star, ClipboardList, CheckCircle2, Circle,
  X, Plus, Eye, Download, Play, Mic, Video, Check,
  Building2, GraduationCap, Briefcase, Globe, Phone, Mail,
  Calendar, DollarSign, Clock, MapPin, ArrowRight, Shield,
  AlertCircle, LayoutDashboard, Users, Filter, MoreHorizontal,
  TrendingUp, ChevronDown, LogOut, Settings, Trash2, BarChart3, FileDown
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const STEPS: { id: Step; label: string }[] = [
  { id: 1,  label: "Privacy" },
  { id: 2,  label: "Personal" },
  { id: 3,  label: "Referral" },
  { id: 4,  label: "Preferences" },
  { id: 5,  label: "Education" },
  { id: 6,  label: "Undergrad" },
  { id: 7,  label: "Experience" },
  { id: 8,  label: "Resume" },
  { id: 9,  label: "Continue?" },
  { id: 10, label: "Assessment" },
];

const PIPELINE_STAGES = [
  { id: "applied",           label: "Applied",           color: "bg-slate-100 text-slate-600",    dot: "bg-slate-400"    },
  { id: "screening",         label: "Screening",         color: "bg-indigo-50 text-indigo-600",   dot: "bg-indigo-400"   },
  { id: "initial_interview", label: "Initial Viber Call", color: "bg-amber-50 text-amber-600",     dot: "bg-amber-400"    },
  { id: "offered",           label: "Offered",           color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400"  },
  { id: "rejected",          label: "Rejected",          color: "bg-red-50 text-red-600",         dot: "bg-red-400"      },
];

// ─── Shared UI Atoms ─────────────────────────────────────────────────────────

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "error" | "info" | "indigo" }) {
  const cls = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-600",
    info: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
  }[variant];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{children}</span>;
}

function Input({ label, helper, prefix, type = "text", placeholder, value, onChange, error, id }: {
  label?: string; helper?: string; prefix?: string; type?: string; placeholder?: string; value?: string; onChange?: (v: string) => void; error?: string; id?: string;
}) {
  return (
    <div id={id} className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}{error ? <span className="text-red-500 ml-1">*</span> : ""}</label>}
      <div className={`flex items-center gap-0 border rounded-lg overflow-hidden bg-white transition-all ${error ? "border-red-400 ring-2 ring-red-400/20" : "border-[#E2E8F0] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400"}`}>
        {prefix && <span className={`px-3 py-2.5 text-sm border-r shrink-0 ${error ? "bg-red-50 text-red-400 border-red-200" : "bg-slate-50 text-slate-500 border-[#E2E8F0]"}`}>{prefix}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
        />
        {error && <AlertCircle size={15} className="text-red-400 mr-3 shrink-0" />}
      </div>
      {error ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p> : helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^(\+63|0)[0-9]{9,10}$/;

function validateStep(step: Step, form: any, agreed: boolean, isReferral: boolean, isUndergrad: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 1) {
    if (!agreed) e.agreed = "You must agree to the Data Privacy Notice to continue.";
  }
  if (step === 2) {
    if (!form.name?.trim()) e.name = "Full name is required.";
    if (!form.email?.trim()) e.email = "Email address is required.";
    else if (!emailRe.test(form.email.trim())) e.email = "Enter a valid email address (e.g. you@email.com).";
    if (!form.phone?.trim()) e.phone = "Mobile number is required.";
    else if (!phoneRe.test(form.phone.trim().replace(/\s/g, ""))) e.phone = "Enter a valid PH mobile number (e.g. +639XXXXXXXXX or 09XXXXXXXXX).";
    if (form.viberSameAsPhone === null || form.viberSameAsPhone === undefined) {
      e.viberSameAsPhone = "Please choose if your Viber number is the same as your mobile number.";
    } else if (!form.viberSameAsPhone) {
      if (!form.viberNumber?.trim()) e.viberNumber = "Viber number is required.";
      else if (!phoneRe.test(form.viberNumber.trim().replace(/\s/g, ""))) e.viberNumber = "Enter a valid PH mobile number for Viber (e.g. +639XXXXXXXXX or 09XXXXXXXXX).";
    }
    if (!form.dob) e.dob = "Date of birth is required.";
    if (!form.gender) e.gender = "Please select your gender.";
    if (!form.city?.trim()) e.city = "City / Municipality is required.";
    if (!form.province?.trim()) e.province = "Province is required.";
    if (!form.source) e.source = "Please select how you heard about us.";
    else if (form.source === "Other" && !form.sourceOther?.trim()) e.sourceOther = "Please tell us how you heard about us.";
    if (!form.position) e.position = "Please select a position to apply for.";
  }
  if (step === 3) {
    if (!form.referrerName?.trim()) e.referrerName = "Referrer name is required.";
  }
  if (step === 4) {
    if (!form.startDate) e.startDate = "Please select your available start date.";
    if (!form.salary?.trim()) e.salary = "Expected salary is required.";
    if (!form.arrangements?.length) e.arrangements = "Please select at least one work arrangement.";
  }
  if (step === 5) {
    if (!form.eduLevel) e.eduLevel = "Please select your highest educational attainment.";
    if (!form.course?.trim()) e.course = "Course / Degree is required.";
    if (!form.school?.trim()) e.school = "School / University is required.";
  }
  if (step === 6) {
    if (!form.undergradYear) e.undergradYear = "Please select your year level.";
  }
  if (step === 7) {
    // Work Experience — optional, no required fields
  }
  if (step === 8) {
    if (!form.resumeFile) e.resumeFile = "Please upload your resume before continuing.";
  }
  if (step === 10) {
    if (!form.cefrFile) e.cefrFile = "Please upload your CEFR test result screenshot.";
    if (!form.vocaroo?.trim()) e.vocaroo = "Vocaroo recording link is required.";
    else if (!form.vocaroo.startsWith("http")) e.vocaroo = "Enter a valid Vocaroo link starting with https://";
    if (!form.veedLink?.trim()) e.veedLink = "VEED recording link is required.";
    else if (!form.veedLink.startsWith("http")) e.veedLink = "Enter a valid VEED link starting with https://";
    if (!form.certified) e.certified = "Please certify that your information is accurate.";
  }
  return e;
}

function SectionCard({ title, icon, children, accent, defaultOpen = true }: { title: string; icon?: React.ReactNode; children: React.ReactNode; accent?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-white rounded-xl border ${accent ? "border-indigo-200 ring-1 ring-indigo-100" : "border-[#E2E8F0]"} shadow-sm overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full px-6 py-4 ${open ? `border-b ${accent ? "border-indigo-100" : "border-[#E2E8F0]"}` : ""} ${accent ? "bg-indigo-50/40" : "bg-slate-50/50"} flex items-center gap-2.5 hover:brightness-95 transition-all text-left`}
      >
        {icon && <span className={`${accent ? "text-indigo-600" : "text-slate-500"}`}>{icon}</span>}
        <h3 className="text-sm font-semibold text-slate-800 tracking-wide uppercase flex-1">{title}</h3>
        <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : "rotate-0"}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Btn({ children, variant = "primary", onClick, disabled, full, size = "md" }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; onClick?: () => void; disabled?: boolean; full?: boolean; size?: "sm" | "md" | "lg";
}) {
  const base = `inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 ${full ? "w-full" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`;
  const sz = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" }[size];
  const v = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-500/20",
    secondary: "bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  return <button className={`${base} ${sz} ${v}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

// ─── Portal: Progress Bar ─────────────────────────────────────────────────────

function PortalNav({ step, setStep, visibleSteps }: { step: Step; setStep: (s: Step) => void; visibleSteps: Step[] }) {
  const visible = STEPS.filter(s => visibleSteps.includes(s.id));
  const idx = visible.findIndex(s => s.id === step);
  const pct = visible.length > 1 ? (idx / (visible.length - 1)) * 100 : 0;
  const currentLabel = visible[idx]?.label ?? "";

  return (
    <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* Brand row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <ImageWithFallback src={logoImg} alt="La Craux logo" className="h-8 w-8 rounded-lg object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">La Craux</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Job Application Portal</p>
            </div>
          </div>
          {/* Mobile: show current step name; desktop: show step counter badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 sm:hidden font-medium">{currentLabel}</span>
            <Badge variant="indigo">Step {idx + 1} of {visible.length}</Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        {/* Step dots — hidden on mobile, shown on sm+ */}
        <div className="hidden sm:flex justify-between">
          {visible.map((s, i) => {
            const done = i < idx;
            const active = s.id === step;
            return (
              <span
                key={s.id}
                className={`flex flex-col items-center gap-0.5 ${active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400"}`}
              >
                <span className={`text-[10px] font-medium whitespace-nowrap ${active ? "font-semibold" : ""}`}>{s.label}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Privacy ─────────────────────────────────────────────────────────

function Step1({ agreed, setAgreed, errors }: { agreed: boolean; setAgreed: (v: boolean) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-5">
      {/* Header image banner */}
      <div className="rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm">
        <ImageWithFallback
          src={headerImg}
          alt="La Craux Job Application Portal header"
          className="w-full object-cover"
        />
      </div>

       {/* Logo + welcome text */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-5 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Welcome!</h1>
          <p className="text-slate-500 mt-1 text-sm max-w-md mx-auto">
            Thank you for your interest in joining <strong>La Craux</strong>. We appreciate your interest in becoming part of our team.Before you begin, please review our data privacy notice below.
          </p>
        </div>
      </div>

      <SectionCard title="Data Privacy Notice" icon={<Shield size={15} />} accent>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>La Craux </strong>respects your privacy and is commited to protecting your personal information in accordance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>. By submitting this application, you voluntarily consent to the collection, processing, storage and the use of the personal information you provide for recruitment and employment-related purposes.
          </p>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Information We Collect</p>
            <ul className="space-y-1.5">
              {["Full name, email address, and contact number", "Date of birth and gender", "Educational background and work experience", "English proficiency assessment results", "Resume and supporting documents", "Video screening recording links"].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
              Your personal information will be used solely to evaluate your qualifications, verify the information you have submitted, communicate with you regarding your application annd where appropriate, retain your application for future employment opputunities.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
              Access to  your personal information will be limited to authorized personnel involved in the recruitment process and, when necessary, authorized service providers who are bound by confidentiality obligations. Your information will not be shared with unauthorized third parties except when required by law or with your consent.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
              <strong>La Craux</strong> implements reasonable administrative, technical, and organizational security measures to safeguard your personal information against unauthorized access, disclosure, alteration, misuse, loss, or destruction.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 border border-[#E2E8F0]">
            <p className="text-xs text-slate-600"><span className="font-semibold">Retention Period:</span> Your personal inforamtion will be retained only for as long as necessary to fulfill the recruitment process and any related legal or legitimate business purposes. Once the retention period has expired or the information is no longer necessary, your personal data will be securely deleted, anonymized, or disposed of in accordance with the Data privacy Act of 2012 (RA 10173) an the company's Data Retention and Disposal Policy.</p>
          </div>
          <a href="https://privacy.gov.ph/data-privacy-act/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors">
            <Globe size={12} />
            National Privacy Commission — Data Privacy Act
            <ArrowRight size={12} />
          </a>
        </div>
      </SectionCard>


      <SectionCard title="Applicant Declaration" icon={<ClipboardList size={15} />}>
        <div className="space-y-2">
          <label id="field-agreed" className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${agreed ? "bg-indigo-600 border-indigo-600" : errors.agreed ? "border-red-400 bg-red-50" : "border-slate-300 group-hover:border-indigo-400"}`}
              onClick={() => setAgreed(!agreed)}>
              {agreed && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm text-slate-700 leading-relaxed">
              Yes, I agree and consent to the processing of my personal data by La Craux in accordance with the Data Privacy Act of 2012 (RA 10173) for the purpose of my job application.
            </span>
          </label>
          {errors.agreed && <p className="text-xs text-red-500 flex items-center gap-1 ml-8"><AlertCircle size={11} />{errors.agreed}</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 2: Personal Info ────────────────────────────────────────────────────

function Step2({ form, setForm, errors }: { form: any; setForm: (f: any) => void; errors: Record<string, string> }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const setPhone = (val: string) => setForm({
    ...form,
    phone: val,
    ...(form.viberSameAsPhone ? { viberNumber: val } : {}),
  });
  const setViberChoice = (same: boolean) => setForm({
    ...form,
    viberSameAsPhone: same,
    viberNumber: same ? form.phone : "",
  });
  const setSource = (val: string) => setForm({ ...form, source: val, ...(val !== "Other" ? { sourceOther: "" } : {}) });
  const howHeard = ["Facebook", "LinkedIn", "Indeed", "Company Website", "Jobstreet", "Referral", "Other"];
  const positions = ["Sales & Operations — Junior Manager", "Marketing — Junior Manager", "Entry Level — Sales Associate"];

  return (
    <div className="space-y-5">
      <SectionCard title="Personal Information" icon={<User size={15} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input id="field-name" label="Full Name" placeholder="e.g., Maria Luisa Santos" helper="Enter your complete legal name as it appears on your ID" value={form.name} onChange={set("name")} error={errors.name} />
          </div>
          <Input id="field-email" label="Email Address" type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} error={errors.email} />
          <Input id="field-phone" label="Mobile Number" placeholder="+639XXXXXXXXX" helper="Format: +639XXXXXXXXX or 09XXXXXXXXX" value={form.phone} onChange={setPhone} error={errors.phone} />
          <div id="field-viberSameAsPhone" className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-700">Is your Viber number the same as your mobile number? {errors.viberSameAsPhone && <span className="text-red-500 ml-1">*</span>}</label>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg transition-all ${errors.viberSameAsPhone ? "ring-2 ring-red-400/20 ring-offset-1" : ""}`}>
              {[
                { label: "Yes, same number", value: true },
                { label: "No, different number", value: false },
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setViberChoice(opt.value)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all text-left ${form.viberSameAsPhone === opt.value ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : errors.viberSameAsPhone ? "bg-white text-slate-600 border-red-300 hover:border-indigo-300" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.viberSameAsPhone && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.viberSameAsPhone}</p>}
          </div>
          {form.viberSameAsPhone === false && (
            <Input id="field-viberNumber" label="Viber Number" placeholder="+639XXXXXXXXX" helper="This will be used for your Initial Viber Call" value={form.viberNumber} onChange={set("viberNumber")} error={errors.viberNumber} />
          )}
          <Input id="field-dob" label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} error={errors.dob} />
          <div id="field-gender" className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Gender {errors.gender && <span className="text-red-500 ml-1">*</span>}</label>
            <div className={`flex gap-2 rounded-lg transition-all ${errors.gender ? "ring-2 ring-red-400/30 ring-offset-1" : ""}`}>
              {["Male", "Female", "Prefer not to say"].map(g => (
                <button key={g} onClick={() => set("gender")(g)} className={`flex-1 py-2.5 text-xs font-medium rounded-lg border transition-all ${form.gender === g ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : errors.gender ? "bg-white text-slate-600 border-red-300 hover:border-indigo-300" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}>
                  {g}
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.gender}</p>}
          </div>
          <Input id="field-city" label="City / Municipality" placeholder="e.g., Makati City" value={form.city} onChange={set("city")} error={errors.city} />
          <Input id="field-province" label="Province" placeholder="e.g., Metro Manila" value={form.province} onChange={set("province")} error={errors.province} />
        </div>
      </SectionCard>

      <SectionCard title="How Did You Hear About Us?" icon={<Globe size={15} />}>
        <div id="field-source" className="space-y-2">
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 rounded-lg transition-all ${errors.source ? "ring-2 ring-red-400/20 ring-offset-1" : ""}`}>
            {howHeard.map(opt => (
              <button key={opt} onClick={() => setSource(opt)} className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-all text-left ${form.source === opt ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : errors.source ? "bg-white text-slate-600 border-red-300 hover:border-indigo-300" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}>
                {opt}
              </button>
            ))}
          </div>
          {errors.source && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.source}</p>}
          {form.source === "Other" && (
            <div className="pt-1">
              <Input id="field-sourceOther" placeholder="Please specify how you heard about us" value={form.sourceOther} onChange={set("sourceOther")} error={errors.sourceOther} />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Position Applied For" icon={<Briefcase size={15} />}>
        <div id="field-position" className="space-y-2">
          <div className={`space-y-2 rounded-lg transition-all ${errors.position ? "ring-2 ring-red-400/20 ring-offset-1" : ""}`}>
            {positions.map(pos => (
              <label key={pos} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group ${form.position === pos ? "border-indigo-400 bg-indigo-50" : errors.position ? "border-red-300" : "border-[#E2E8F0]"}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${form.position === pos ? "border-indigo-600" : errors.position ? "border-red-400" : "border-slate-300 group-hover:border-indigo-400"}`}>
                  {form.position === pos && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <input type="radio" className="sr-only" checked={form.position === pos} onChange={() => set("position")(pos)} />
                <span className="text-sm text-slate-700">{pos}</span>
              </label>
            ))}
          </div>
          {errors.position && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.position}</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 3: Referral ─────────────────────────────────────────────────────────

function Step3({ form, setForm, errors }: { form: any; setForm: (f: any) => void; errors: Record<string, string> }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">You indicated that you were referred by someone. Please fill in their details below.</p>
      </div>
      <SectionCard title="Referral Information" icon={<Users size={15} />} accent>
        <div className="space-y-4">
          <Input id="field-referrerName" label="Full Name of Referrer" placeholder="e.g., Jose Dela Cruz" value={form.referrerName} onChange={set("referrerName")} error={errors.referrerName} />
          <Input label="Position / Department" placeholder="e.g., Sales Associate, Operations" helper="Optional" value={form.referrerDept} onChange={set("referrerDept")} />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 4: Education ────────────────────────────────────────────────────────

function Step4({ form, setForm, errors }: { form: any; setForm: (f: any) => void; errors: Record<string, string> }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const levels = ["Bachelor's Degree", "College Undergraduate", "Associate Degree", "Senior High School", "High School", "Other"];
  return (
    <div className="space-y-5">
      <SectionCard title="Educational Background" icon={<GraduationCap size={15} />}>
        <div className="space-y-4">
          <div id="field-eduLevel" className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Highest Educational Attainment {errors.eduLevel && <span className="text-red-500 ml-1">*</span>}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {levels.map(lvl => (
                <label key={lvl} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group ${form.eduLevel === lvl ? "border-indigo-400 bg-indigo-50" : errors.eduLevel ? "border-red-300 hover:border-indigo-300 hover:bg-slate-50" : "border-[#E2E8F0] hover:border-indigo-300 hover:bg-slate-50"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${form.eduLevel === lvl ? "border-indigo-600" : errors.eduLevel ? "border-red-400" : "border-slate-300 group-hover:border-indigo-400"}`}>
                    {form.eduLevel === lvl && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                  <input type="radio" className="sr-only" checked={form.eduLevel === lvl} onChange={() => set("eduLevel")(lvl)} />
                  <span className="text-sm text-slate-700">{lvl}</span>
                </label>
              ))}
            </div>
            {errors.eduLevel && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.eduLevel}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="md:col-span-2">
              <Input id="field-course" label="Course / Degree" placeholder="e.g., Bachelor of Science in Information Technology" value={form.course} onChange={set("course")} error={errors.course} helper="Enter the full name of your course or degree program as it appears on your transcript or diploma. Do not use abbreviations or acronyms." />
            </div>
            <Input id="field-school" label="School / University" helper="Enter the full name of your School or University. Do not use abbreviations or acronyms." placeholder="e.g., University of Santo Tomas" value={form.school} onChange={set("school")} error={errors.school} />
            <Input label="Campus / Branch" placeholder="e.g., Espana, Manila" value={form.campus} onChange={set("campus")} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 5: College Undergrad Details ───────────────────────────────────────

function Step5({ form, setForm, errors }: { form: any; setForm: (f: any) => void; errors: Record<string, string> }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year+"];
  return (
    <div className="space-y-5">
      <SectionCard title="College Undergraduate Details" icon={<GraduationCap size={15} />} accent>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">How many years of college have you completed? {errors.undergradYear && <span className="text-red-500">*</span>}</p>
          <div id="field-undergradYear" className="flex flex-wrap gap-2">
            {years.map(yr => (
              <button key={yr} onClick={() => set("undergradYear")(yr)} className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${form.undergradYear === yr ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : errors.undergradYear ? "bg-white text-slate-600 border-red-300 hover:border-indigo-300" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}>
                {yr}
              </button>
            ))}
          </div>
          {errors.undergradYear && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.undergradYear}</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 6: Work Experience ──────────────────────────────────────────────────

function Step6({ form, setForm, errors: _errors }: { form: any; setForm: (f: any) => void; errors: Record<string, string> }) {
  const industries = ["Cosmetics", "Fragrance", "FMCG", "Retail", "Sales", "Marketing", "E-commerce", "Other"];
  const toggle = (ind: string) => {
    const curr: string[] = form.industries || [];
    setForm({ ...form, industries: curr.includes(ind) ? curr.filter((i: string) => i !== ind) : [...curr, ind] });
  };
  return (
    <div className="space-y-5">
      <SectionCard title="Work Experience" icon={<Briefcase size={15} />}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Select all industries you have experience in. You may choose multiple.</p>
          <div className="flex flex-wrap gap-2">
            {industries.map(ind => {
              const sel = (form.industries || []).includes(ind);
              return (
                <button key={ind} onClick={() => toggle(ind)} className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${sel ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-400 hover:bg-indigo-50/50"}`}>
                  {sel && <span className="mr-1.5">✓</span>}{ind}
                </button>
              );
            })}
          </div>
          {(form.industries || []).length > 0 && (
            <p className="text-xs text-indigo-600 font-medium">{(form.industries || []).length} industry/industries selected</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 7: English Proficiency ──────────────────────────────────────────────

function Step7({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const steps = [
    { n: 1, t: "Take the Test", d: "Click the link below to access the British Council CEFR Online Test." },
    { n: 2, t: "Complete Assessment", d: "Complete the free English proficiency test. It takes approximately 15–20 minutes." },
    { n: 3, t: "Screenshot Results", d: "Take a clear screenshot of your test result showing your CEFR level." },
    { n: 4, t: "Upload Here", d: "Upload the screenshot in the file upload area below." },
  ];
  return (
    <div className="space-y-5">
      <SectionCard title="English Proficiency Assessment" icon={<Globe size={15} />}>
        <div className="space-y-5">
          <div className="space-y-3">
            {steps.map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30">{s.n}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.t}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="https://www.britishcouncil.org/english/online-english-test" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-500/30">
            <Globe size={14} />
            Take British Council CEFR Test
            <ArrowRight size={14} />
          </a>
          <label className="block border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 text-center hover:border-indigo-300 transition-colors cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 group">
            {form.cefrFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <FileText size={18} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{form.cefrFile.name}</p>
                <p className="text-xs text-emerald-600 font-medium">Ready to upload</p>
                <button type="button" onClick={e => { e.preventDefault(); setForm({ ...form, cefrFile: null }); }} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
            ) : (
              <>
                <Upload size={24} className="text-slate-400 group-hover:text-indigo-500 mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-slate-700">Upload CEFR Test Result Screenshot</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, or PDF — max 5MB</p>
              </>
            )}
            <input type="file" className="sr-only" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) setForm({ ...form, cefrFile: f }); }} />
          </label>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 8: Job Preferences ──────────────────────────────────────────────────

function Step8({ form, setForm, errors }: { form: any; setForm: (f: any) => void; errors: Record<string, string> }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const startDates = ["Immediately", "Within 2 weeks", "Within 1 month", "Other"];
  const arrangements = ["Onsite", "Sampaloc, Manila Office", "Holidays", "Weekends", "Extended Hours", "Mall Operational Hours"];
  const toggleArr = (a: string) => {
    const curr: string[] = form.arrangements || [];
    setForm({ ...form, arrangements: curr.includes(a) ? curr.filter((x: string) => x !== a) : [...curr, a] });
  };
  return (
    <div className="space-y-5">
      <SectionCard title="Job Preferences" icon={<Clock size={15} />}>
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Available Start Date {errors.startDate && <span className="text-red-500 ml-1">*</span>}</p>
            <div id="field-startDate" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {startDates.map(d => (
                <button key={d} onClick={() => set("startDate")(d)} className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-all ${form.startDate === d ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : errors.startDate ? "bg-white text-slate-600 border-red-300 hover:border-indigo-300" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}>{d}</button>
              ))}
            </div>
            {errors.startDate && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={11} />{errors.startDate}</p>}
          </div>
          <Input id="field-salary" label="Expected Monthly Salary" prefix="PHP" placeholder="e.g., 25,000" type="text" value={form.salary} onChange={set("salary")} error={errors.salary} />
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Work Arrangement — select all that apply {errors.arrangements && <span className="text-red-500 ml-1">*</span>}</p>
            <div id="field-arrangements" className="flex flex-col gap-2">
              {arrangements.map(a => {
                const sel = (form.arrangements || []).includes(a);
                return (
                  <label key={a} onClick={() => toggleArr(a)} className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${sel ? "border-indigo-400 bg-indigo-50" : errors.arrangements ? "border-red-300 hover:border-indigo-300 hover:bg-slate-50" : "border-[#E2E8F0] hover:border-indigo-300 hover:bg-slate-50"}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${sel ? "bg-indigo-600 border-indigo-600" : errors.arrangements ? "border-red-400" : "border-slate-300"}`}>
                      {sel && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm text-slate-700">{a}</span>
                  </label>
                );
              })}
            </div>
            {errors.arrangements && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={11} />{errors.arrangements}</p>}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 9: Resume ───────────────────────────────────────────────────────────

function Step9({ form, setForm, errors }: { form: any; setForm: (f: any) => void; errors: Record<string, string> }) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState("");

  const handleFile = async (file: File) => {
    setForm({ ...form, resumeFile: file });
    // Best-effort resume parsing to prefill fields the applicant hasn't already filled in.
    try {
      setParsing(true);
      setParseMsg("");
      const { parseResumeFile } = await import("@/lib/parseResume");
      const parsed = await parseResumeFile(file);
      if (parsed) {
        const patch: Record<string, string> = {};
        if (!form.name?.trim() && parsed.name) patch.name = parsed.name;
        if (!form.email?.trim() && parsed.email) patch.email = parsed.email;
        if (!form.phone?.trim() && parsed.phone) patch.phone = parsed.phone;
        if (!form.school?.trim() && parsed.school) patch.school = parsed.school;
        if (!form.course?.trim() && parsed.course) patch.course = parsed.course;
        if (Object.keys(patch).length) {
          setForm({ ...form, resumeFile: file, ...patch });
          setParseMsg(`Auto-filled ${Object.keys(patch).length} field(s) from your resume — please double-check them.`);
        } else {
          setParseMsg("Resume scanned — no additional details detected to auto-fill.");
        }
      }
    } catch {
      setParseMsg("Couldn't auto-scan this file, but it's still attached and ready to upload.");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Resume Submission" icon={<FileText size={15} />}>
        <div className="space-y-4">
          <label
            id="field-resumeFile"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
            className={`block border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${dragging ? "border-indigo-400 bg-indigo-50" : errors.resumeFile ? "border-red-400 bg-red-50/30" : "border-[#E2E8F0] hover:border-indigo-300 hover:bg-indigo-50/20 bg-slate-50/50"}`}
          >
            {form.resumeFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <FileText size={22} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{form.resumeFile.name}</p>
                <p className="text-xs text-emerald-600 font-medium">{parsing ? "Scanning résumé…" : "File ready for upload"}</p>
                <button type="button" onClick={e => { e.preventDefault(); setForm({ ...form, resumeFile: null }); setParseMsg(""); }} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Upload size={20} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Drag and drop your resume here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse files</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {[".pdf", ".doc", ".docx"].map(ext => <Badge key={ext}>{ext}</Badge>)}
                </div>
                <p className="text-xs text-slate-400">Maximum file size: 10MB</p>
              </div>
            )}
            <input type="file" className="sr-only" accept=".pdf,.doc,.docx" onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
          </label>
          {parseMsg && <p className="text-xs text-indigo-600 flex items-center gap-1.5"><Search size={11} />{parseMsg}</p>}
          {errors.resumeFile && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.resumeFile}</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 9: Decision Prompt ──────────────────────────────────────────────────

function Step9Decision({ onProceed, onSubmitNow }: { onProceed: () => void; onSubmitNow: () => void }) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/50 flex items-center gap-2.5">
          <span className="text-slate-500"><ClipboardList size={15} /></span>
          <h3 className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Almost There!</h3>
        </div>
        <div className="px-6 py-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your basic information has been saved.</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Do you still wish to continue and answer our remaining assessments? This includes an English proficiency test, a Vocaroo voice recording, and a video screening.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={onProceed}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-sm shadow-indigo-500/20"
            >
              <ArrowRight size={16} />
              Proceed to Assessments
            </button>
            <button
              onClick={onSubmitNow}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-slate-300 text-slate-700 text-sm font-semibold px-6 py-3 rounded-xl transition-all"
            >
              <CheckCircle2 size={16} />
              Submit Without Assessments
            </button>
          </div>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Completing the assessments gives your application a higher chance of being reviewed. You may still submit now and our HR team will reach out with next steps.
        </p>
      </div>
    </div>
  );
}

// ─── Step 10: Combined Assessment (English + Vocaroo + Video) ─────────────────

function Step10Combined({ form, setForm, position, errors }: { form: any; setForm: (f: any) => void; position: string; errors: Record<string, string> }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const isJunior = position === "Sales & Operations — Junior Manager" || position === "Marketing — Junior Manager";
  const videoQuestion = isJunior
    ? "What is your understanding of the role, and how does your experience relate to it?"
    : "You have 3 minutes to convince a customer to buy a perfume. Your time starts now.";

  return (
    <div className="space-y-5">

      {/* English Proficiency */}
      <SectionCard title="English Proficiency Assessment" icon={<Globe size={15} />}>
        <div className="space-y-5">
          <div className="space-y-3">
            {[
              { n: 1, t: "Take the Test", d: "Click the link below to access the British Council CEFR Online Test." },
              { n: 2, t: "Complete Assessment", d: "Complete the free English proficiency test. It takes approximately 15–20 minutes." },
              { n: 3, t: "Screenshot Results", d: "Take a clear screenshot of your test result showing your CEFR level." },
              { n: 4, t: "Upload Here", d: "Upload the screenshot in the file upload area below." },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30">{s.n}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.t}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="https://www.britishcouncil.org/english/online-english-test" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-500/30">
            <Globe size={14} /> Take British Council CEFR Test <ArrowRight size={14} />
          </a>
          <label id="field-cefrFile" className={`block border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group ${errors.cefrFile ? "border-red-400 bg-red-50/30" : "border-[#E2E8F0] hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/20"}`}>
            {form.cefrFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <FileText size={18} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{form.cefrFile.name}</p>
                <p className="text-xs text-emerald-600 font-medium">Ready to upload</p>
                <button type="button" onClick={e => { e.preventDefault(); setForm({ ...form, cefrFile: null }); }} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
            ) : (
              <>
                <Upload size={24} className={`mx-auto mb-2 transition-colors ${errors.cefrFile ? "text-red-400" : "text-slate-400 group-hover:text-indigo-500"}`} />
                <p className="text-sm font-medium text-slate-700">Upload CEFR Test Result Screenshot</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, or PDF — max 5MB</p>
              </>
            )}
            <input type="file" className="sr-only" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) setForm({ ...form, cefrFile: f }); }} />
          </label>
          {errors.cefrFile && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.cefrFile}</p>}
        </div>
      </SectionCard>

      {/* Vocaroo */}
      <SectionCard title="Voice Recording — Vocaroo" icon={<Mic size={15} />}>
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-indigo-900">"Tell us why you want to join our company."</p>
            <p className="text-xs text-slate-600 leading-relaxed">Briefly explain why you are interested in joining La Craux Fragrance and how your skills can contribute to the company.</p>
            <p className="text-xs text-slate-600 leading-relaxed">Record a 1–2 minute response using Vocaroo. After recording, copy the shareable link and paste it in the field below. Please ensure the link is accessible before submitting your application.</p>
            <a href="https://vocaroo.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-500/20">
              <Mic size={13} /> Open Vocaroo to Record <ArrowRight size={13} />
            </a>
          </div>
          <div id="field-vocaroo" className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mic size={14} className="text-indigo-500" /> Vocaroo Voice Recording Link {errors.vocaroo && <span className="text-red-500">*</span>}
            </label>
            <div className={`flex items-center border rounded-lg overflow-hidden bg-white transition-all ${errors.vocaroo ? "border-red-400 ring-2 ring-red-400/20" : "border-[#E2E8F0] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400"}`}>
              <span className={`px-3 py-2.5 text-sm border-r shrink-0 ${errors.vocaroo ? "bg-red-50 text-red-400 border-red-200" : "bg-slate-50 text-slate-500 border-[#E2E8F0]"}`}><Link2 size={14} /></span>
              <input type="url" placeholder="https://vocaroo.com/..." value={form.vocaroo} onChange={e => set("vocaroo")(e.target.value)} className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent" />
              {errors.vocaroo && <AlertCircle size={15} className="text-red-400 mr-3 shrink-0" />}
            </div>
            {errors.vocaroo ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.vocaroo}</p> : <p className="text-xs text-slate-500">Record at vocaroo.com and paste the sharing link here</p>}
          </div>
        </div>
      </SectionCard>

      {/* Video Screening */}
      <SectionCard title="Video Screening Assessment" icon={<Video size={15} />}>
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Instructions</p>
            {[
              { text: "Open the VEED Webcam Recorder.", link: { label: "Open VEED Webcam Recorder", url: "https://www.veed.io/tools/webcam-recorder" } },
              { text: "Click Start Recording." },
              { text: 'When asked "What would you like to record?", select Camera.' },
              { text: "Allow your browser to access your camera and microphone when prompted." },
              { text: "Click the Record button to start recording your video." },
              { text: "Once you have finished recording, click Stop, then click Done." },
              { text: "Select Continue with Watermark." },
              { text: "Sign in to VEED using your Google (Gmail) account. Click Continue with Google. If you're already signed in to Google on your browser, simply select your account to continue." },
              { text: "Wait for the video to finish processing, then click Share or Copy Link." },
              { text: "Paste the shareable video link into the designated Video Recording Link field below." },
            ].map((inst, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                <div className="pt-0.5 space-y-1">
                  <p className="text-sm text-slate-600">{inst.text}</p>
                  {"link" in inst && inst.link && (
                    <a href={inst.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors">
                      <Video size={11} />{inst.link.label}<ArrowRight size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Video Requirements</p>
            {["Video Length: 1–3 minutes only.", "Record in a quiet and well-lit area.", "Make sure your face is clearly visible throughout the recording.", "Speak clearly and confidently."].map(req => (
              <p key={req} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 size={14} className="text-violet-500 mt-0.5 shrink-0" />{req}
              </p>
            ))}
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Your Video Prompt</p>
            <p className="text-sm font-medium text-indigo-900 leading-relaxed">"{videoQuestion}"</p>
          </div>
          <div id="field-veedLink" className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Video size={14} className="text-violet-500" /> Paste Your VEED.io Recording Link {errors.veedLink && <span className="text-red-500">*</span>}
            </label>
            <div className={`flex items-center border rounded-lg overflow-hidden bg-white transition-all ${errors.veedLink ? "border-red-400 ring-2 ring-red-400/20" : "border-[#E2E8F0] focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-400"}`}>
              <span className={`px-3 py-2.5 text-sm border-r shrink-0 ${errors.veedLink ? "bg-red-50 text-red-400 border-red-200" : "bg-slate-50 text-slate-500 border-[#E2E8F0]"}`}><Link2 size={14} /></span>
              <input type="url" placeholder="https://www.veed.io/view/..." value={form.veedLink} onChange={e => set("veedLink")(e.target.value)} className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent" />
              {errors.veedLink && <AlertCircle size={15} className="text-red-400 mr-3 shrink-0" />}
            </div>
            {errors.veedLink && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.veedLink}</p>}
          </div>
        </div>
      </SectionCard>

      {/* Final Certification */}
      <SectionCard title="Final Certification" icon={<ClipboardList size={15} />}>
        <div id="field-certified" className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${form.certified ? "bg-indigo-600 border-indigo-600" : errors.certified ? "border-red-400 bg-red-50" : "border-slate-300 group-hover:border-indigo-400"}`}
              onClick={() => setForm({ ...form, certified: !form.certified })}>
              {form.certified && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm text-slate-700">Yes, I certify that all information provided in this application is accurate and truthful to the best of my knowledge.</span>
          </label>
          {errors.certified && <p className="text-xs text-red-500 flex items-center gap-1 ml-8"><AlertCircle size={11} />{errors.certified}</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Applicant Portal ─────────────────────────────────────────────────────────

const DRAFT_KEY = "lacraux_draft";
const STEP_KEY  = "lacraux_step";

const EMPTY_FORM = {
  name: "", email: "", phone: "", dob: "", gender: "", city: "", province: "",
  source: "", sourceOther: "", position: "", referrerName: "", referrerDept: "",
  eduLevel: "", course: "", school: "", campus: "", undergradYear: "",
  industries: [], startDate: "", salary: "", arrangements: [], whyJoin: "",
  viberSameAsPhone: null, viberNumber: "", vocaroo: "", resumeFile: null, cefrFile: null, veedLink: "", certified: false,
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_FORM, ...JSON.parse(raw) } : EMPTY_FORM;
  } catch { return EMPTY_FORM; }
}

function loadStep(): Step {
  try {
    const s = Number(localStorage.getItem(STEP_KEY));
    return (s >= 1 && s <= 10 ? s : 1) as Step;
  } catch { return 1; }
}

export function ApplicantPortal() {
  const [step, setStepState] = useState<Step>(loadStep);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setFormState] = useState<any>(loadDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);

  // Persist step
  const setStep = (s: Step) => { setStepState(s); setErrors({}); setShowErrors(false); localStorage.setItem(STEP_KEY, String(s)); };

  // Persist form (skip File objects — can't serialize those)
  const setForm = (f: any) => {
    setFormState(f);
    // Re-validate live if errors already shown
    if (showErrors) setErrors(validateStep(step, f, agreed, f.source === "Referral", f.eduLevel === "College Undergraduate"));
    try {
      const { resumeFile, cefrFile, ...rest } = f;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    } catch {}
  };

  const isReferral = form.source === "Referral";
  const isUndergrad = form.eduLevel === "College Undergraduate";
  const isJunior = form.position === "Sales & Operations — Junior Manager" || form.position === "Marketing — Junior Manager";

  const visibleSteps: Step[] = [1, 2];
  if (isReferral) visibleSteps.push(3);
  visibleSteps.push(4, 5);
  if (isUndergrad) visibleSteps.push(6);
  visibleSteps.push(7, 8, 9, 10);

  const visibleIdx = visibleSteps.indexOf(step);
  const canGoNext = visibleIdx < visibleSteps.length - 1;
  const canGoPrev = visibleIdx > 0;

  const currentErrors = validateStep(step, form, agreed, isReferral, isUndergrad);
  const stepIsValid = Object.keys(currentErrors).length === 0;

  const scrollToFirstError = (errs: Record<string, string>) => {
    requestAnimationFrame(() => {
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const goNext = () => {
    const errs = validateStep(step, form, agreed, isReferral, isUndergrad);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShowErrors(true);
      scrollToFirstError(errs);
      return;
    }
    setErrors({});
    setShowErrors(false);
    if (canGoNext) setStep(visibleSteps[visibleIdx + 1]);
  };
  const goPrev = () => { if (canGoPrev) setStep(visibleSteps[visibleIdx - 1]); };

  const nextDisabled = false; // validation handled in goNext, button always clickable

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-500 text-sm mb-6">Thank you for applying to La Craux. Our HR team will review your application and reach out within 3–5 business days.</p>
          <Btn onClick={() => { setFormState(EMPTY_FORM); setSubmitted(false); setStep(1); }} variant="primary">Start New Application</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: "Inter, sans-serif" }}>
      <PortalNav step={step} setStep={setStep} visibleSteps={visibleSteps} />
      <div className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {step === 1 && <Step1 agreed={agreed} setAgreed={setAgreed} errors={showErrors ? errors : {}} />}
        {step === 2 && <Step2 form={form} setForm={setForm} errors={showErrors ? errors : {}} />}
        {step === 3 && <Step3 form={form} setForm={setForm} errors={showErrors ? errors : {}} />}
        {step === 4 && <Step8 form={form} setForm={setForm} errors={showErrors ? errors : {}} />}
        {step === 5 && <Step4 form={form} setForm={setForm} errors={showErrors ? errors : {}} />}
        {step === 6 && <Step5 form={form} setForm={setForm} errors={showErrors ? errors : {}} />}
        {step === 7 && <Step6 form={form} setForm={setForm} errors={showErrors ? errors : {}} />}
        {step === 8 && <Step9 form={form} setForm={setForm} errors={showErrors ? errors : {}} />}
        {step === 9 && (
          <Step9Decision
            onProceed={() => setStep(10)}
            onSubmitNow={async () => {
              setSubmitting(true);
              setSubmitError("");
              try {
                await submitApplication(form);
                localStorage.removeItem(DRAFT_KEY);
                localStorage.removeItem(STEP_KEY);
                toast.success("Application submitted successfully!", { icon: "🎉" });
                setSubmitted(true);
              } catch (err: any) {
                const msg = err.message || "Submission failed. Please try again.";
                setSubmitError(msg);
                toast.error(msg);
              } finally {
                setSubmitting(false);
              }
            }}
          />
        )}
        {step === 10 && <Step10Combined form={form} setForm={setForm} position={form.position} errors={showErrors ? errors : {}} />}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-[#E2E8F0] shadow-lg z-30">
        {submitError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 max-w-3xl mx-auto">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-700">{submitError}</p>
          </div>
        )}
        {step !== 9 && (
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Btn variant="secondary" onClick={goPrev} disabled={!canGoPrev || submitting}>
              <ChevronLeft size={16} /> Back
            </Btn>
            <div className="flex items-center gap-2">
              {!stepIsValid && showErrors && (
                <span className="text-xs text-red-500 font-medium hidden sm:flex items-center gap-1">
                  <AlertCircle size={12} /> Fill in required fields
                </span>
              )}
              {canGoNext ? (
                <Btn variant="primary" onClick={goNext} disabled={submitting}>
                  <span className={stepIsValid ? "" : "opacity-60"}>Continue</span> <ChevronRight size={16} />
                </Btn>
              ) : (
                <Btn
                  variant="primary"
                  disabled={submitting}
                  onClick={async () => {
                    const errs = validateStep(step, form, agreed, isReferral, isUndergrad);
                    if (Object.keys(errs).length > 0) { setErrors(errs); setShowErrors(true); scrollToFirstError(errs); return; }
                    setSubmitting(true);
                    setSubmitError("");
                    try {
                      await submitApplication(form);
                      localStorage.removeItem(DRAFT_KEY);
                      localStorage.removeItem(STEP_KEY);
                      toast.success("Application submitted successfully!", { icon: "🎉" });
                      setSubmitted(true);
                    } catch (err: any) {
                      const msg = err.message || "Submission failed. Please try again.";
                      setSubmitError(msg);
                      toast.error(msg);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? "Submitting…" : <><CheckCircle2 size={16} /> <span className={stepIsValid ? "" : "opacity-60"}>Submit Application</span></>}
                </Btn>
              )}
            </div>
          </div>
        )}
        {step === 9 && (
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Btn variant="secondary" onClick={goPrev} disabled={submitting}>
              <ChevronLeft size={16} /> Back
            </Btn>
            {submitting && <p className="text-xs text-slate-500 italic">Submitting…</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

type Notification = { id: number; message: string; time: Date; read: boolean; type: "applied" | "advanced" | "rejected" | "interview" | "deleted" };

const FILTER_FIELDS = [
  { key: "name", label: "Name" }, { key: "email", label: "Email" },
  { key: "gender", label: "Gender" }, { key: "city", label: "City" },
  { key: "province", label: "Province" }, { key: "source", label: "Source" },
  { key: "role", label: "Position" }, { key: "eduLevel", label: "Education Level" },
  { key: "school", label: "School" }, { key: "campus", label: "Campus" },
  { key: "industries", label: "Industries" }, { key: "arrangements", label: "Work Arrangements" },
] as const;

const STAGE_ORDER = ["applied", "screening", "initial_interview", "offered", "rejected"] as const;

// ── Report generation helpers ──────────────────────────────────────────────

function buildReportSummary(candidates: Candidate[]) {
  const total = candidates.length;
  const byStage: Record<string, number> = {};
  const byPosition: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byProvince: Record<string, number> = {};
  candidates.forEach(c => {
    byStage[c.stage] = (byStage[c.stage] || 0) + 1;
    byPosition[c.role || "Unspecified"] = (byPosition[c.role || "Unspecified"] || 0) + 1;
    byProvince[c.province || "Unspecified"] = (byProvince[c.province || "Unspecified"] || 0) + 1;
  });
  return { total, byStage, byPosition, byProvince };
}

function downloadCSV(candidates: Candidate[]) {
  const headers = [
    "Name", "Email", "Phone", "Viber Number", "Stage", "Position", "Source",
    "City", "Province", "Education Level", "Course", "School", "Campus",
    "Start Date", "Expected Salary", "Work Arrangements", "Industries", "Submitted At",
  ];
  const rows = candidates.map(c => [
    c.name, c.email, c.phone, c.viberNumber, c.stage, c.role, c.source,
    c.city, c.province, c.eduLevel, c.course, c.school, c.campus,
    c.startDate, c.salary, c.arrangements, c.industries, c.submittedAt,
  ]);
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lacraux-applicants-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ReportModal({ candidates, onClose }: { candidates: Candidate[]; onClose: () => void }) {
  const { total, byStage, byPosition, byProvince } = buildReportSummary(candidates);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><BarChart3 size={17} className="text-indigo-600" /> Applicant Report</h3>
            <p className="text-xs text-slate-500 mt-0.5">Overall snapshot of {total} applicant{total !== 1 ? "s" : ""} currently on file</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PIPELINE_STAGES.map(s => (
              <div key={s.id} className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{byStage[s.id] ?? 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">By Position</p>
            <div className="space-y-1.5">
              {Object.entries(byPosition).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{k}</span>
                  <Badge variant="indigo">{v}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">By Province</p>
            <div className="space-y-1.5">
              {Object.entries(byProvince).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{k}</span>
                  <Badge>{v}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex justify-end gap-2">
          <Btn variant="secondary" size="sm" onClick={onClose}>Close</Btn>
          <Btn variant="primary" size="sm" onClick={() => downloadCSV(candidates)}><FileDown size={14} /> Download CSV</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Document preview helper ────────────────────────────────────────────────

function driveFileId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function DocPreviewModal({ label, link, onClose }: { label: string; link: string; onClose: () => void }) {
  const id = driveFileId(link);
  const previewUrl = id ? `https://drive.google.com/file/d/${id}/preview` : link;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <div className="flex items-center gap-2">
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">Open in Drive <ArrowRight size={11} /></a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
          </div>
        </div>
        <iframe src={previewUrl} className="flex-1 w-full" title={label} />
      </div>
    </div>
  );
}

export function AdminDashboard({ onLogout }: { onLogout?: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [activeStage, setActiveStage] = useState("applied");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "documents" | "notes" | "audit">("details");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");

  // Filter panel
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterField, setFilterField] = useState<string>("name");
  const [filterValue, setFilterValue] = useState("");

  // Advance modal
  const [advanceModal, setAdvanceModal] = useState(false);
  const [advanceTarget, setAdvanceTarget] = useState<Candidate | null>(null);

  // Interview scheduling modal (shown when advancing into initial interview)
  const [interviewModal, setInterviewModal] = useState(false);
  const [interviewTarget, setInterviewTarget] = useState<Candidate | null>(null);
  const [interviewStage, setInterviewStage] = useState<"initial_interview">("initial_interview");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewViberNumber, setInterviewViberNumber] = useState("");
  const SCHEDULES_KEY = "lacraux_interview_schedules";
  const interviewSchedules = useRef<Record<number, { date: string; time: string; viberNumber: string; stage: string }>>(
    (() => { try { return JSON.parse(sessionStorage.getItem(SCHEDULES_KEY) || "{}"); } catch { return {}; } })()
  );
  const saveSchedules = () => sessionStorage.setItem(SCHEDULES_KEY, JSON.stringify(interviewSchedules.current));

  // Reject confirm
  const [rejectModal, setRejectModal] = useState(false);

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);

  // Document preview modal
  const [docPreview, setDocPreview] = useState<{ label: string; link: string } | null>(null);

  // Logout confirm
  const [logoutModal, setLogoutModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Candidate | null>(null);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifId = useRef(0);

  const addNotif = (message: string, type: Notification["type"]) => {
    setNotifications(prev => [{ id: ++notifId.current, message, time: new Date(), read: false, type }, ...prev].slice(0, 50));
    if (type === "rejected" || type === "deleted") toast.error(message);
    else if (type === "interview") toast.success(message, { icon: "📅" });
    else if (type === "applied") toast.info(message, { icon: "📋" });
    else toast.success(message, { icon: "⬆️" });
  };

  const OVERRIDES_KEY = "lacraux_stage_overrides";
  const stageOverrides = useRef<Record<number, string>>(
    (() => { try { return JSON.parse(sessionStorage.getItem(OVERRIDES_KEY) || "{}"); } catch { return {}; } })()
  );
  const saveOverrides = () => sessionStorage.setItem(OVERRIDES_KEY, JSON.stringify(stageOverrides.current));

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setFetchError("");
    try {
      const prev = candidates;
      const data = await fetchApplications();
      // Notify about new applicants on silent refresh
      if (silent && prev.length > 0) {
        const newOnes = data.filter(d => !prev.find(p => p.id === d.id));
        newOnes.forEach(c => addNotif(`New application from ${c.name} for ${c.role}`, "applied"));
      }
      // Preserve local stage changes (reject/advance) that haven't been written back to the sheet
      const merged = data.map(c => stageOverrides.current[c.id] ? { ...c, stage: stageOverrides.current[c.id] } : c);
      setCandidates(merged);
      setLastUpdated(new Date());
      if (!silent && merged.length) {
        setSelected(merged.find(c => c.name.trim() || c.email.trim() || c.role.trim()) ?? null);
      }
    } catch (e: any) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  const advanceCandidate = (c: Candidate) => {
    const idx = STAGE_ORDER.indexOf(c.stage as any);
    const next = idx >= 0 && idx < STAGE_ORDER.length - 2 ? STAGE_ORDER[idx + 1] : null;
    if (!next) return;
    setAdvanceModal(false);
    setAdvanceTarget(null);
    // Interview stages need scheduling first
    if (next === "initial_interview") {
      setInterviewTarget(c);
      setInterviewStage(next);
      setInterviewDate("");
      setInterviewTime("");
      setInterviewViberNumber("");
      setInterviewModal(true);
      return;
    }
    const nextLabel = PIPELINE_STAGES.find(p => p.id === next)?.label ?? next;
    stageOverrides.current[c.id] = next;
    saveOverrides();
    const updated = candidates.map(x => x.id === c.id ? { ...x, stage: next } : x);
    setCandidates(updated);
    setSelected(null);
    addNotif(`${c.name} advanced to ${nextLabel}`, "advanced");
  };

  const confirmInterview = () => {
    if (!interviewTarget) return;
    const stage = interviewStage;
    const label = PIPELINE_STAGES.find(p => p.id === stage)?.label ?? stage;
    interviewSchedules.current[interviewTarget.id] = {
      date: interviewDate, time: interviewTime, viberNumber: interviewViberNumber, stage,
    };
    saveSchedules();
    stageOverrides.current[interviewTarget.id] = stage;
    saveOverrides();
    const updated = candidates.map(x => x.id === interviewTarget!.id ? { ...x, stage } : x);
    setCandidates(updated);
    setSelected(null);
    addNotif(`${interviewTarget.name} scheduled for ${label} on ${interviewDate} at ${interviewTime}`, "interview");
    setInterviewModal(false);
    setInterviewTarget(null);
  };

  const rejectCandidate = (c: Candidate) => {
    stageOverrides.current[c.id] = "rejected";
    saveOverrides();
    const updated = candidates.map(x => x.id === c.id ? { ...x, stage: "rejected" } : x);
    setCandidates(updated);
    setSelected(null);
    addNotif(`${c.name} has been rejected`, "rejected");
    setRejectModal(false);
    setRejectTarget(null);
  };

  const deleteCandidate = async (c: Candidate) => {
    setDeleting(true);
    try {
      await deleteApplication({ submittedAt: c.submittedAt, email: c.email });
      const updated = candidates.filter(x => x.id !== c.id);
      setCandidates(updated);
      setSelected(null);
      addNotif(`${c.name}'s application has been deleted`, "deleted");
      setDeleteModal(false);
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete application.");
    } finally {
      setDeleting(false);
    }
  };

  const stageCounts = PIPELINE_STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.id] = candidates.filter(c => c.stage === s.id).length;
    return acc;
  }, {});

  const filtered = candidates.filter(c => {
    if (c.stage !== activeStage) return false;
    const q = search.toLowerCase();
    const matchSearch = q === "" || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filterValue.trim()) {
      const val = filterValue.toLowerCase();
      const fieldVal = String((c as any)[filterField] || "").toLowerCase();
      if (!fieldVal.includes(val)) return false;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const stageInfo = selected ? PIPELINE_STAGES.find(p => p.id === selected.stage) : null;
  const nextStage = selected ? STAGE_ORDER[STAGE_ORDER.indexOf(selected.stage as any) + 1] : null;
  const nextStageLabel = nextStage ? PIPELINE_STAGES.find(p => p.id === nextStage)?.label : null;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Report Modal ── */}
      {reportOpen && <ReportModal candidates={candidates} onClose={() => setReportOpen(false)} />}

      {/* ── Document Preview Modal ── */}
      {docPreview && <DocPreviewModal label={docPreview.label} link={docPreview.link} onClose={() => setDocPreview(null)} />}

      {/* ── Advance Modal ── */}
      {advanceModal && advanceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-slate-900">Advance Candidate</h3>
              <p className="text-xs text-slate-500 mt-0.5">Move this applicant to the next stage in the pipeline.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0">{advanceTarget.avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{advanceTarget.name}</p>
                  <p className="text-xs text-slate-500">{advanceTarget.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 border border-[#E2E8F0] rounded-xl p-3">
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-500 mb-1">Current</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PIPELINE_STAGES.find(p => p.id === advanceTarget.stage)?.color ?? "bg-slate-100 text-slate-600"}`}>
                    {PIPELINE_STAGES.find(p => p.id === advanceTarget.stage)?.label}
                  </span>
                </div>
                <ArrowRight size={16} className="text-slate-400 shrink-0" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-500 mb-1">Next</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PIPELINE_STAGES.find(p => p.id === nextStage)?.color ?? "bg-indigo-50 text-indigo-600"}`}>
                    {nextStageLabel ?? "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-2 justify-end">
              <Btn variant="secondary" size="sm" onClick={() => { setAdvanceModal(false); setAdvanceTarget(null); }}>Cancel</Btn>
              <Btn variant="primary" size="sm" onClick={() => advanceCandidate(advanceTarget)}><ArrowRight size={14} /> Confirm Advance</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-slate-900">Reject Applicant</h3>
              <p className="text-xs text-slate-500 mt-0.5">This action will move the candidate to the Rejected stage.</p>
            </div>
            <div className="px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-bold shrink-0">{rejectTarget.avatar}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{rejectTarget.name}</p>
                <p className="text-xs text-slate-500">{rejectTarget.role}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-2 justify-end">
              <Btn variant="secondary" size="sm" onClick={() => { setRejectModal(false); setRejectTarget(null); }}>Cancel</Btn>
              <Btn variant="danger" size="sm" onClick={() => rejectCandidate(rejectTarget)}><X size={14} /> Confirm Reject</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-slate-900">Delete Application</h3>
              <p className="text-xs text-slate-500 mt-0.5">This permanently removes the applicant's row from the Google Sheet. This cannot be undone.</p>
            </div>
            <div className="px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-bold shrink-0">{deleteTarget.avatar}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{deleteTarget.name}</p>
                <p className="text-xs text-slate-500">{deleteTarget.role}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-2 justify-end">
              <Btn variant="secondary" size="sm" onClick={() => { setDeleteModal(false); setDeleteTarget(null); }} disabled={deleting}>Cancel</Btn>
              <Btn variant="danger" size="sm" onClick={() => deleteCandidate(deleteTarget)} disabled={deleting}><Trash2 size={14} /> {deleting ? "Deleting…" : "Confirm Delete"}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Interview Schedule Modal ── */}
      {interviewModal && interviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-0.5">
                <Calendar size={16} className="text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Schedule Initial Viber Call
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Set the date, time, and Viber number for the initial call.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Candidate row */}
              <div className="flex items-center gap-3 bg-slate-50 border border-[#E2E8F0] rounded-xl p-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{interviewTarget.avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{interviewTarget.name}</p>
                  <p className="text-xs text-slate-500">{interviewTarget.role}</p>
                </div>
                <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-600">
                  Initial Viber Call
                </span>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Date <span className="text-red-400">*</span></label>
                  <input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Time <span className="text-red-400">*</span></label>
                  <input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700">Viber Number <span className="text-red-400">*</span></label>
                <input type="text"
                  placeholder="e.g. +639XXXXXXXXX"
                  value={interviewViberNumber} onChange={e => setInterviewViberNumber(e.target.value)}
                  className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-2 justify-end">
              <Btn variant="secondary" size="sm" onClick={() => { setInterviewModal(false); setInterviewTarget(null); }}>Cancel</Btn>
              <Btn variant="primary" size="sm"
                onClick={confirmInterview}
                // @ts-ignore — disable if required fields empty
                disabled={!interviewDate || !interviewTime || !interviewViberNumber.trim()}>
                <Calendar size={13} /> Confirm Schedule
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Modal ── */}
      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                <LogOut size={24} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Log out of HR Portal?</h3>
              <p className="text-sm text-slate-500 mt-1.5">You will be returned to the login screen. Your session data will be preserved.</p>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={() => {
                  setLogoutModal(false);
                  sessionStorage.removeItem("lacraux_hr_auth");
                  toast.info("Logged out successfully.");
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2">
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-56" : "w-16"} bg-[#1E293B] flex flex-col transition-all duration-200 shrink-0`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <ImageWithFallback src={logoImg} alt="La Craux" className="w-7 h-7 rounded-lg object-contain shrink-0" />
            {sidebarOpen && <div>
              <p className="text-white font-semibold text-sm leading-none">La Craux</p>
              <p className="text-slate-400 text-xs leading-none mt-0.5">HR Portal</p>
            </div>}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarOpen && <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2">Pipeline</p>}
          {PIPELINE_STAGES.map(stage => (
            <button key={stage.id} onClick={() => { setActiveStage(stage.id); setSelected(null); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${activeStage === stage.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dot}`} />
              {sidebarOpen && <>
                <span className="flex-1 text-left font-medium text-xs">{stage.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${activeStage === stage.id ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"}`}>{stageCounts[stage.id] ?? 0}</span>
              </>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setReportOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all">
            <BarChart3 size={14} />
            {sidebarOpen && <span className="text-xs font-medium">Generate Report</span>}
          </button>
          <button
            onClick={() => setLogoutModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all">
            <LogOut size={14} />
            {sidebarOpen && <span className="text-xs font-medium">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-auto">

        {/* Top Nav */}
        <header className="bg-white border-b border-[#E2E8F0] px-5 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <LayoutDashboard size={16} />
          </button>
          {/* Search */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2 bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input type="text" placeholder="Search by name or role…" value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none flex-1 min-w-0" />
              {search && <button onClick={() => setSearch("")}><X size={13} className="text-slate-400 hover:text-slate-600" /></button>}
            </div>
          </div>
          {/* Filter toggle */}
          <button onClick={() => setFilterOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${filterOpen || filterValue ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-[#E2E8F0] text-slate-600 hover:bg-slate-50"}`}>
            <Filter size={13} /> Filter {filterValue && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
          </button>
          {/* Report button (top bar convenience) */}
          <button onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
            <BarChart3 size={13} /> Report
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Last updated */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border border-[#E2E8F0] rounded-lg px-3 py-1.5 bg-slate-50">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${refreshing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
              {lastUpdated ? <span>Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> : <span>Loading…</span>}
            </div>
            {/* Refresh */}
            <button onClick={() => loadData(true)} disabled={refreshing} title="Refresh" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? "animate-spin" : ""}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            </button>
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setNotifOpen(o => !o); setNotifications(n => n.map(x => ({ ...x, read: true }))); }}
                className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    {notifications.length > 0 && <button onClick={() => setNotifications([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear all</button>}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={22} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No notifications yet</p>
                      </div>
                    ) : notifications.map(n => {
                      const icon = n.type === "applied" ? <ClipboardList size={12} /> : n.type === "rejected" ? <X size={12} /> : n.type === "deleted" ? <Trash2 size={12} /> : n.type === "interview" ? <Calendar size={12} /> : <ArrowRight size={12} />;
                      const color = n.type === "applied" ? "bg-indigo-100 text-indigo-600" : n.type === "rejected" || n.type === "deleted" ? "bg-red-100 text-red-600" : n.type === "interview" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600";
                      return (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${color}`}>{icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{n.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">HR</div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">HR Manager</p>
                <p className="text-xs text-slate-500 leading-none mt-0.5">La Craux</p>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="bg-white border-b border-[#E2E8F0] px-5 py-3 flex flex-wrap items-center gap-3 shrink-0">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Filter by</p>
            <select value={filterField} onChange={e => { setFilterField(e.target.value); setFilterValue(""); }}
              className="text-xs border border-[#E2E8F0] rounded-lg px-2.5 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              {FILTER_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs border border-[#E2E8F0] rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input autoFocus type="text" placeholder={`Filter by ${FILTER_FIELDS.find(f => f.key === filterField)?.label}…`}
                value={filterValue} onChange={e => setFilterValue(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none" />
              {filterValue && <button onClick={() => setFilterValue("")}><X size={12} className="text-slate-400 hover:text-slate-600" /></button>}
            </div>
            {filterValue && (
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
            <button onClick={() => { setFilterOpen(false); setFilterValue(""); }} className="text-xs text-slate-400 hover:text-slate-600 ml-auto">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading applications…</p>
            </div>
          </div>
        )}
        {!loading && fetchError && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 mb-1">Could not load applications</p>
              <p className="text-xs text-slate-500 mb-4">{fetchError}</p>
              <Btn variant="secondary" size="sm" onClick={() => { setLoading(true); setFetchError(""); fetchApplications().then(d => { setCandidates(d); setSelected(d.find(c => c.name.trim() || c.email.trim() || c.role.trim()) ?? null); }).catch(e => setFetchError(e.message)).finally(() => setLoading(false)); }}>Try again</Btn>
            </div>
          </div>
        )}

        {!loading && !fetchError && (
          <div className="flex-1 flex overflow-hidden">
            {/* Candidate List */}
            <div className="w-72 border-r border-[#E2E8F0] bg-white flex flex-col overflow-hidden shrink-0">
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{PIPELINE_STAGES.find(p => p.id === activeStage)?.label}</p>
                  <p className="text-xs text-slate-500">{filtered.length} candidate{filtered.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Users size={28} className="text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-500">{filterValue ? "No matches found" : "No applicants yet"}</p>
                    <p className="text-xs text-slate-400 mt-1">{filterValue ? "Try a different filter value." : "Submissions will appear here once candidates apply."}</p>
                  </div>
                ) : filtered.map(c => (
                  <button key={c.id} onClick={() => setSelected(c)} className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors ${selected?.id === c.id ? "bg-indigo-50 border-l-2 border-l-indigo-600" : "border-l-2 border-l-transparent"}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{c.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{c.role}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{c.submittedAt ? new Date(c.submittedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : ""}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Detail */}
            <div className="flex-1 overflow-y-auto bg-[#F9FAFB] min-h-0" onClick={() => notifOpen && setNotifOpen(false)}>
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                  <User size={36} className="text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-500">Select a candidate to view their profile</p>
                </div>
              ) : (
                <>
                  {/* Profile Header */}
                  <div className="bg-white border-b border-[#E2E8F0] px-6 py-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-500/20 shrink-0">{selected.avatar}</div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                            {stageInfo && <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${stageInfo.color}`}>{stageInfo.label}</span>}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{selected.role}</p>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11} />{selected.email}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} />{selected.phone}</span>
                              <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} />Viber {selected.viberNumber || "—"}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} />{selected.city}{selected.province ? `, ${selected.province}` : ""}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={11} />Applied {selected.submittedAt ? new Date(selected.submittedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Btn variant="secondary" size="sm" onClick={() => { setDeleteTarget(selected); setDeleteModal(true); }}><Trash2 size={13} /> Delete</Btn>
                        {selected.stage !== "rejected" && selected.stage !== "offered" && (
                          <Btn variant="danger" size="sm" onClick={() => { setRejectTarget(selected); setRejectModal(true); }}><X size={13} /> Reject</Btn>
                        )}
                        {nextStageLabel && selected.stage !== "rejected" && (
                          <Btn variant="primary" size="sm" onClick={() => { setAdvanceTarget(selected); setAdvanceModal(true); }}><ArrowRight size={13} /> Advance to {nextStageLabel}</Btn>
                        )}
                      </div>
                    </div>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1"><Mic size={13} className="text-slate-400" /><p className="text-xs text-slate-500">Vocaroo Recording</p></div>
                        {selected.vocaroo ? <a href={selected.vocaroo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"><Play size={11} className="fill-indigo-600" /> Open recording <ArrowRight size={11} /></a>
                          : <p className="text-xs text-slate-400 italic">Not submitted</p>}
                      </div>
                      <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1"><Video size={13} className="text-slate-400" /><p className="text-xs text-slate-500">VEED Video</p></div>
                        {selected.veedLink ? <a href={selected.veedLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700"><Play size={11} className="fill-violet-600" /> Watch video <ArrowRight size={11} /></a>
                          : <p className="text-xs text-slate-400 italic">Not submitted</p>}
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="bg-white border-b border-[#E2E8F0] px-6 flex gap-1">
                    {(["details", "documents", "notes", "audit"] as const).map(tab => {
                      const labels = { details: "Application Details", documents: "Documents", notes: "HR Notes", audit: "Audit Log" };
                      return <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{labels[tab]}</button>;
                    })}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === "details" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Interview Schedule card — shown when a schedule exists */}
                        {interviewSchedules.current[selected.id] && (() => {
                          const sched = interviewSchedules.current[selected.id];
                          const stageLabel = PIPELINE_STAGES.find(p => p.id === sched.stage)?.label ?? sched.stage;
                          return (
                            <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                              <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                                <Calendar size={16} className="text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">{stageLabel} Schedule</p>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
                                  <span className="flex items-center gap-1.5"><Calendar size={12} className="text-amber-500" />{sched.date ? new Date(sched.date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—"}</span>
                                  <span className="flex items-center gap-1.5"><Clock size={12} className="text-amber-500" />{sched.time || "—"}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <Phone size={11} className="text-slate-400" />
                                  <span>Viber: {sched.viberNumber || "—"}</span>
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Education</p>
                          <p className="text-sm font-semibold text-slate-800">{selected.course || "—"}</p>
                          <p className="text-sm text-slate-500">{[selected.school, selected.campus].filter(Boolean).join(", ") || "—"}</p>
                          {selected.eduLevel && <div className="mt-2"><Badge variant="indigo">{selected.eduLevel}</Badge></div>}
                          {selected.undergradYear && <p className="text-xs text-slate-500 mt-1">Year completed: {selected.undergradYear}</p>}
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Industry Experience</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selected.industries ? selected.industries.split(",").map(i => i.trim()).filter(Boolean).map(i => <Badge key={i}>{i}</Badge>) : <p className="text-xs text-slate-400 italic">None specified</p>}
                          </div>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Job Preferences</p>
                          <div className="space-y-1.5 text-sm text-slate-600">
                            <p className="flex items-center gap-2"><DollarSign size={12} className="text-slate-400" />{selected.salary ? `PHP ${selected.salary} / month` : "—"}</p>
                            <p className="flex items-center gap-2"><Clock size={12} className="text-slate-400" />{selected.startDate || "—"}</p>
                            <p className="flex items-center gap-2"><MapPin size={12} className="text-slate-400" />{selected.arrangements || "—"}</p>
                          </div>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Personal Details</p>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p><span className="text-slate-400 text-xs">Gender:</span> {selected.gender || "—"}</p>
                            <p><span className="text-slate-400 text-xs">Date of Birth:</span> {selected.dob || "—"}</p>
                            <p><span className="text-slate-400 text-xs">Source:</span> {selected.source === "Other" && selected.sourceOther ? `Other — ${selected.sourceOther}` : (selected.source || "—")}</p>
                            {selected.referrerName && <p><span className="text-slate-400 text-xs">Referred by:</span> {selected.referrerName}{selected.referrerDept ? ` (${selected.referrerDept})` : ""}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === "documents" && (
                      <div className="space-y-3">
                        {[{ label: "Resume", link: selected.resumeLink }, { label: "CEFR Test Result", link: selected.cefrLink }].map(doc => (
                          <div key={doc.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center"><FileText size={16} className="text-indigo-600" /></div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{doc.label}</p>
                                <p className="text-xs text-slate-500">{doc.link ? "Uploaded to Google Drive" : "Not submitted"}</p>
                              </div>
                            </div>
                            {doc.link && (
                              <div className="flex items-center gap-2">
                                <Btn variant="secondary" size="sm" onClick={() => setDocPreview({ label: doc.label, link: doc.link })}><Eye size={13} /> Preview</Btn>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "notes" && (
                      <div className="space-y-4">
                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">HR Rating</p>
                          <div className="flex items-center gap-1 mb-3">
                            {[1,2,3,4,5].map(n => <Star key={n} size={18} className="text-slate-200 fill-slate-200 cursor-pointer hover:text-amber-400 hover:fill-amber-400 transition-colors" />)}
                          </div>
                          <textarea rows={4} placeholder="Add internal notes about this candidate…" className="w-full text-sm text-slate-700 placeholder:text-slate-400 border border-[#E2E8F0] rounded-lg p-3 resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all" />
                          <div className="mt-3 flex justify-end"><Btn variant="primary" size="sm">Save Notes</Btn></div>
                        </div>
                      </div>
                    )}
                    {activeTab === "audit" && (
                      <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                        <div className="flex items-start gap-3 px-4 py-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5"><ClipboardList size={11} /></div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">Application submitted</p>
                            <p className="text-xs text-slate-500">{selected.name} · {selected.submittedAt ? new Date(selected.submittedAt).toLocaleString("en-PH") : "—"}</p>
                          </div>
                        </div>
                        {selected.stage !== "applied" && (
                          <div className="flex items-start gap-3 px-4 py-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><ArrowRight size={11} /></div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">Stage updated to {stageInfo?.label}</p>
                              <p className="text-xs text-slate-500">By HR Manager</p>
                            </div>
                          </div>
                        )}
                        {interviewSchedules.current[selected.id] && (() => {
                          const sched = interviewSchedules.current[selected.id];
                          return (
                            <div className="flex items-start gap-3 px-4 py-3">
                              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5"><Calendar size={11} /></div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">Interview scheduled — {sched.date} at {sched.time}</p>
                                <p className="text-xs text-slate-500">Initial Viber Call · {sched.viberNumber} · By HR Manager</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Login ──────────────────────────────────────────────────────────────

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
const SESSION_KEY = "lacraux_hr_auth";

function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        sessionStorage.setItem(SESSION_KEY, "1");
        toast.success("Welcome back, HR Manager!", { icon: "👋" });
        onAuth();
      } else {
        setError("Invalid username or password.");
        toast.error("Login failed. Check your credentials.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">HR Portal</h1>
          <p className="text-slate-400 text-sm mt-1">La Craux — Admin Access</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
            <p className="text-white text-sm font-semibold">Sign in to continue</p>
            <p className="text-indigo-200 text-xs mt-0.5">Authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Username</label>
              <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2.5 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
                <User size={14} className="text-slate-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(""); }}
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
              <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all ${error ? "border-red-300" : "border-[#E2E8F0]"}`}>
                <Shield size={14} className="text-slate-400 shrink-0" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                  {showPass ? <Eye size={14} /> : <Eye size={14} className="opacity-40" />}
                </button>
              </div>
              {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 mt-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                : <><ArrowRight size={15} /> Sign In</>}
            </button>
          </form>

          <div className="px-6 pb-5 text-center">
            <p className="text-xs text-slate-400">Having trouble? Contact your system administrator.</p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">© {new Date().getFullYear()} La Craux. All rights reserved.</p>
      </div>
    </div>
  );
}

export function AdminRoute() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }} />;
}

// ─── Root App ─────────────────────────────────────────────────────────────────

import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton expand={false} />
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}