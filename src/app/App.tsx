import { useState, useRef, useEffect } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoImg from "@/imports/729992358_122093591751385044_3796083363275797365_n.jpg";
import headerImg from "@/imports/La_Craux_Gform_Image_Header.png";
import { submitApplication } from "@/lib/submitApplication";
import { fetchApplications, type Candidate } from "@/lib/fetchApplications";
import {
  ChevronRight, ChevronLeft, Upload, Link2, Bell, Search,
  User, FileText, Star, ClipboardList, CheckCircle2, Circle,
  X, Plus, Eye, Download, Play, Mic, Video, Check,
  Building2, GraduationCap, Briefcase, Globe, Phone, Mail,
  Calendar, DollarSign, Clock, MapPin, ArrowRight, Shield,
  AlertCircle, LayoutDashboard, Users, Filter, MoreHorizontal,
  TrendingUp, ChevronDown, LogOut, Settings
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
  { id: "applied",   label: "Applied",      color: "bg-slate-100 text-slate-600",  dot: "bg-slate-400"  },
  { id: "screening", label: "Screening",    color: "bg-indigo-50 text-indigo-600", dot: "bg-indigo-400" },
  { id: "video",     label: "Video Review", color: "bg-violet-50 text-violet-600", dot: "bg-violet-400" },
  { id: "interview", label: "Interview",    color: "bg-amber-50 text-amber-600",   dot: "bg-amber-400"  },
  { id: "offered",   label: "Offered",      color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  { id: "rejected",  label: "Rejected",     color: "bg-red-50 text-red-600",       dot: "bg-red-400"    },
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

function Input({ label, helper, prefix, type = "text", placeholder, value, onChange }: {
  label?: string; helper?: string; prefix?: string; type?: string; placeholder?: string; value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="flex items-center gap-0 border border-[#E2E8F0] rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
        {prefix && <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-sm border-r border-[#E2E8F0] shrink-0">{prefix}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
        />
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
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
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center gap-0.5 transition-all ${active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400"}`}
              >
                <span className={`text-[10px] font-medium whitespace-nowrap ${active ? "font-semibold" : ""}`}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Privacy ─────────────────────────────────────────────────────────

function Step1({ agreed, setAgreed }: { agreed: boolean; setAgreed: (v: boolean) => void }) {
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
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${agreed ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"}`}
            onClick={() => setAgreed(!agreed)}>
            {agreed && <Check size={12} className="text-white" strokeWidth={3} />}
          </div>
          <span className="text-sm text-slate-700 leading-relaxed">
            Yes, I agree and consent to the processing of my personal data by La Craux in accordance with the Data Privacy Act of 2012 (RA 10173) for the purpose of my job application.
          </span>
        </label>
      </SectionCard>
    </div>
  );
}

// ─── Step 2: Personal Info ────────────────────────────────────────────────────

function Step2({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const howHeard = ["Facebook", "LinkedIn", "Indeed", "Company Website", "Jobstreet", "Referral", "Other"];
  const positions = ["Sales & Operations — Junior Manager", "Marketing — Junior Manager", "Entry Level — Sales Associate"];

  return (
    <div className="space-y-5">
      <SectionCard title="Personal Information" icon={<User size={15} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Full Name" placeholder="e.g., Maria Luisa Santos" helper="Enter your complete legal name as it appears on your ID" value={form.name} onChange={set("name")} />
          </div>
          <Input label="Email Address" type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} />
          <Input label="Mobile Number" placeholder="+639XXXXXXXXX" helper="Format: +639XXXXXXXXX" value={form.phone} onChange={set("phone")} />
          <Input label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Gender</label>
            <div className="flex gap-2">
              {["Male", "Female", "Prefer not to say"].map(g => (
                <button key={g} onClick={() => set("gender")(g)} className={`flex-1 py-2.5 text-xs font-medium rounded-lg border transition-all ${form.gender === g ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Input label="City / Municipality" placeholder="e.g., Makati City" value={form.city} onChange={set("city")} />
          <Input label="Province" placeholder="e.g., Metro Manila" value={form.province} onChange={set("province")} />
        </div>
      </SectionCard>

      <SectionCard title="How Did You Hear About Us?" icon={<Globe size={15} />}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {howHeard.map(opt => (
            <button key={opt} onClick={() => set("source")(opt)} className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-all text-left ${form.source === opt ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}>
              {opt}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Position Applied For" icon={<Briefcase size={15} />}>
        <div className="space-y-2">
          {positions.map(pos => (
            <label key={pos} className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${form.position === pos ? "border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"}`}>
                {form.position === pos && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <input type="radio" className="sr-only" checked={form.position === pos} onChange={() => set("position")(pos)} />
              <span className="text-sm text-slate-700">{pos}</span>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 3: Referral ─────────────────────────────────────────────────────────

function Step3({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">You indicated that you were referred by someone. Please fill in their details below.</p>
      </div>
      <SectionCard title="Referral Information" icon={<Users size={15} />} accent>
        <div className="space-y-4">
          <Input label="Full Name of Referrer" placeholder="e.g., Jose Dela Cruz" value={form.referrerName} onChange={set("referrerName")} />
          <Input label="Position / Department" placeholder="e.g., Sales Associate, Operations" helper="Optional" value={form.referrerDept} onChange={set("referrerDept")} />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 4: Education ────────────────────────────────────────────────────────

function Step4({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const levels = ["Bachelor's Degree", "College Undergraduate", "Associate Degree", "Senior High School", "High School", "Other"];
  return (
    <div className="space-y-5">
      <SectionCard title="Educational Background" icon={<GraduationCap size={15} />}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Highest Educational Attainment</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {levels.map(lvl => (
                <label key={lvl} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group ${form.eduLevel === lvl ? "border-indigo-400 bg-indigo-50" : "border-[#E2E8F0] hover:border-indigo-300 hover:bg-slate-50"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${form.eduLevel === lvl ? "border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"}`}>
                    {form.eduLevel === lvl && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                  <input type="radio" className="sr-only" checked={form.eduLevel === lvl} onChange={() => set("eduLevel")(lvl)} />
                  <span className="text-sm text-slate-700">{lvl}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="md:col-span-2">
              <Input label="Course / Degree" placeholder="e.g., Bachelor of Science in Information Technology" value={form.course} onChange={set("course")} />
            </div>
            <Input label="School / University" placeholder="e.g., University of Santo Tomas" value={form.school} onChange={set("school")} />
            <Input label="Campus / Branch" placeholder="e.g., Espana, Manila" value={form.campus} onChange={set("campus")} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 5: College Undergrad Details ───────────────────────────────────────

function Step5({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year+"];
  return (
    <div className="space-y-5">
      <SectionCard title="College Undergraduate Details" icon={<GraduationCap size={15} />} accent>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">How many years of college have you completed?</p>
          <div className="flex flex-wrap gap-2">
            {years.map(yr => (
              <button key={yr} onClick={() => set("undergradYear")(yr)} className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${form.undergradYear === yr ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}>
                {yr}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 6: Work Experience ──────────────────────────────────────────────────

function Step6({ form, setForm }: { form: any; setForm: (f: any) => void }) {
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

function Step8({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const set = (key: string) => (val: string) => setForm({ ...form, [key]: val });
  const startDates = ["Immediately", "Within 2 weeks", "Within 1 month", "Other"];
  const arrangements = ["Work on-site at our Head Office in Sampaloc, Manila", "Work on Holidays", "Work during weekends", "Work during mall operational hours", "Extend working hours when necessary"];
  const toggleArr = (a: string) => {
    const curr: string[] = form.arrangements || [];
    setForm({ ...form, arrangements: curr.includes(a) ? curr.filter((x: string) => x !== a) : [...curr, a] });
  };
  return (
    <div className="space-y-5">
      <SectionCard title="Job Preferences" icon={<Clock size={15} />}>
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Available Start Date</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {startDates.map(d => (
                <button key={d} onClick={() => set("startDate")(d)} className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-all ${form.startDate === d ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-[#E2E8F0] hover:border-indigo-300"}`}>{d}</button>
              ))}
            </div>
          </div>
          <Input label="Expected Monthly Salary" prefix="PHP" placeholder="e.g., 25,000" type="text" value={form.salary} onChange={set("salary")} />
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Work Arrangement (select all that apply)</p>
            <div className="flex flex-col gap-2">
              {arrangements.map(a => {
                const sel = (form.arrangements || []).includes(a);
                return (
                  <label key={a} className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${sel ? "border-indigo-400 bg-indigo-50" : "border-[#E2E8F0] hover:border-indigo-300 hover:bg-slate-50"}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${sel ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`} onClick={() => toggleArr(a)}>
                      {sel && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm text-slate-700">{a}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 9: Resume ───────────────────────────────────────────────────────────

function Step9({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div className="space-y-5">
      <SectionCard title="Resume Submission" icon={<FileText size={15} />}>
        <div className="space-y-4">
          <label
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) setForm({ ...form, resumeFile: file }); }}
            className={`block border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${dragging ? "border-indigo-400 bg-indigo-50" : "border-[#E2E8F0] hover:border-indigo-300 hover:bg-indigo-50/20 bg-slate-50/50"}`}
          >
            {form.resumeFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <FileText size={22} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{form.resumeFile.name}</p>
                <p className="text-xs text-emerald-600 font-medium">File ready for upload</p>
                <button type="button" onClick={e => { e.preventDefault(); setForm({ ...form, resumeFile: null }); }} className="text-xs text-red-500 hover:text-red-600">Remove</button>
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
            <input type="file" className="sr-only" accept=".pdf,.doc,.docx" onChange={e => { const file = e.target.files?.[0]; if (file) setForm({ ...form, resumeFile: file }); }} />
          </label>
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

function Step10Combined({ form, setForm, position }: { form: any; setForm: (f: any) => void; position: string }) {
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
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mic size={14} className="text-indigo-500" /> Vocaroo Voice Recording Link
            </label>
            <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
              <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-sm border-r border-[#E2E8F0] shrink-0"><Link2 size={14} /></span>
              <input type="url" placeholder="https://vocaroo.com/..." value={form.vocaroo} onChange={e => set("vocaroo")(e.target.value)} className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent" />
            </div>
            <p className="text-xs text-slate-500">Record at vocaroo.com and paste the sharing link here</p>
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
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Video size={14} className="text-violet-500" /> Paste Your VEED.io Recording Link
            </label>
            <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-400 transition-all">
              <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-sm border-r border-[#E2E8F0] shrink-0"><Link2 size={14} /></span>
              <input type="url" placeholder="https://www.veed.io/view/..." value={form.veedLink} onChange={e => set("veedLink")(e.target.value)} className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Final Certification */}
      <SectionCard title="Final Certification" icon={<ClipboardList size={15} />}>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${form.certified ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"}`}
            onClick={() => setForm({ ...form, certified: !form.certified })}>
            {form.certified && <Check size={12} className="text-white" strokeWidth={3} />}
          </div>
          <span className="text-sm text-slate-700">Yes, I certify that all information provided in this application is accurate and truthful to the best of my knowledge.</span>
        </label>
      </SectionCard>
    </div>
  );
}

// ─── Applicant Portal ─────────────────────────────────────────────────────────

const DRAFT_KEY = "lacraux_draft";
const STEP_KEY  = "lacraux_step";

const EMPTY_FORM = {
  name: "", email: "", phone: "", dob: "", gender: "", city: "", province: "",
  source: "", position: "", referrerName: "", referrerDept: "",
  eduLevel: "", course: "", school: "", campus: "", undergradYear: "",
  industries: [], startDate: "", salary: "", arrangements: [], whyJoin: "",
  vocaroo: "", resumeFile: null, cefrFile: null, veedLink: "", certified: false,
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Persist step
  const setStep = (s: Step) => { setStepState(s); localStorage.setItem(STEP_KEY, String(s)); };

  // Persist form (skip File objects — can't serialize those)
  const setForm = (f: any) => {
    setFormState(f);
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

  const goNext = () => { if (canGoNext) setStep(visibleSteps[visibleIdx + 1]); };
  const goPrev = () => { if (canGoPrev) setStep(visibleSteps[visibleIdx - 1]); };

  const nextDisabled = step === 1 && !agreed;

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
        {step === 1 && <Step1 agreed={agreed} setAgreed={setAgreed} />}
        {step === 2 && <Step2 form={form} setForm={setForm} />}
        {step === 3 && <Step3 form={form} setForm={setForm} />}
        {step === 4 && <Step8 form={form} setForm={setForm} />}
        {step === 5 && <Step4 form={form} setForm={setForm} />}
        {step === 6 && <Step5 form={form} setForm={setForm} />}
        {step === 7 && <Step6 form={form} setForm={setForm} />}
        {step === 8 && <Step9 form={form} setForm={setForm} />}
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
                setSubmitted(true);
              } catch (err: any) {
                setSubmitError(err.message || "Submission failed. Please try again.");
              } finally {
                setSubmitting(false);
              }
            }}
          />
        )}
        {step === 10 && <Step10Combined form={form} setForm={setForm} position={form.position} />}
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
              {canGoNext ? (
                <Btn variant="primary" onClick={goNext} disabled={nextDisabled || submitting}>
                  Continue <ChevronRight size={16} />
                </Btn>
              ) : (
                <Btn
                  variant="primary"
                  disabled={!form.certified || submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    setSubmitError("");
                    try {
                      await submitApplication(form);
                      localStorage.removeItem(DRAFT_KEY);
                      localStorage.removeItem(STEP_KEY);
                      setSubmitted(true);
                    } catch (err: any) {
                      setSubmitError(err.message || "Submission failed. Please try again.");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? "Submitting…" : <><CheckCircle2 size={16} /> Submit Application</>}
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

export function AdminDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeStage, setActiveStage] = useState("applied");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "documents" | "notes" | "audit">("details");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchApplications()
      .then(data => { setCandidates(data); if (data.length) setSelected(data[0]); })
      .catch(e => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stageCounts = PIPELINE_STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.id] = candidates.filter(c => c.stage === s.id).length;
    return acc;
  }, {});

  const filtered = candidates.filter(c =>
    c.stage === activeStage &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()))
  );

  const stageInfo = selected ? PIPELINE_STAGES.find(p => p.id === selected.stage) : null;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
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
            <button
              key={stage.id}
              onClick={() => { setActiveStage(stage.id); setSelected(null); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${activeStage === stage.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dot}`} />
              {sidebarOpen && <>
                <span className="flex-1 text-left font-medium text-xs">{stage.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${activeStage === stage.id ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"}`}>{stageCounts[stage.id] ?? 0}</span>
              </>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          {[{ icon: <Settings size={14} />, label: "Settings" }, { icon: <LogOut size={14} />, label: "Log Out" }].map(item => (
            <button key={item.label} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all">
              {item.icon}
              {sidebarOpen && <span className="text-xs font-medium">{item.label}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Top Nav */}
        <header className="bg-white border-b border-[#E2E8F0] px-5 py-3 flex items-center gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <LayoutDashboard size={16} />
          </button>
          <div className="flex-1 max-w-xs">
            <div className="flex items-center gap-2 bg-slate-50 border border-[#E2E8F0] rounded-lg px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input type="text" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none flex-1 min-w-0" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell size={16} />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">HR</div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">HR Manager</p>
                <p className="text-xs text-slate-500 leading-none mt-0.5">La Craux</p>
              </div>
            </div>
          </div>
        </header>

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
              <Btn variant="secondary" size="sm" onClick={() => { setLoading(true); setFetchError(""); fetchApplications().then(d => { setCandidates(d); if (d.length) setSelected(d[0]); }).catch(e => setFetchError(e.message)).finally(() => setLoading(false)); }}>
                Try again
              </Btn>
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
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                  <Filter size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Users size={28} className="text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-500">No applicants yet</p>
                    <p className="text-xs text-slate-400 mt-1">Submissions will appear here once candidates apply.</p>
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
            <div className="flex-1 overflow-y-auto bg-[#F9FAFB] min-h-0">
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
                            <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} />{selected.city}{selected.province ? `, ${selected.province}` : ""}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={11} />Applied {selected.submittedAt ? new Date(selected.submittedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Btn variant="secondary" size="sm"><Calendar size={13} /> Schedule Interview</Btn>
                        <Btn variant="danger" size="sm"><X size={13} /> Reject</Btn>
                        <Btn variant="primary" size="sm"><ArrowRight size={13} /> Advance</Btn>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Mic size={13} className="text-slate-400" />
                          <p className="text-xs text-slate-500">Vocaroo Recording</p>
                        </div>
                        {selected.vocaroo ? (
                          <a href={selected.vocaroo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                            <Play size={11} className="fill-indigo-600" /> Open recording <ArrowRight size={11} />
                          </a>
                        ) : <p className="text-xs text-slate-400 italic">Not submitted</p>}
                      </div>
                      <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Video size={13} className="text-slate-400" />
                          <p className="text-xs text-slate-500">VEED Video</p>
                        </div>
                        {selected.veedLink ? (
                          <a href={selected.veedLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700">
                            <Play size={11} className="fill-violet-600" /> Watch video <ArrowRight size={11} />
                          </a>
                        ) : <p className="text-xs text-slate-400 italic">Not submitted</p>}
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="bg-white border-b border-[#E2E8F0] px-6 flex gap-1">
                    {(["details", "documents", "notes", "audit"] as const).map(tab => {
                      const labels = { details: "Application Details", documents: "Documents", notes: "HR Notes", audit: "Audit Log" };
                      return (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === "details" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <p><span className="text-slate-400 text-xs">Source:</span> {selected.source || "—"}</p>
                            {selected.referrerName && <p><span className="text-slate-400 text-xs">Referred by:</span> {selected.referrerName}{selected.referrerDept ? ` (${selected.referrerDept})` : ""}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === "documents" && (
                      <div className="space-y-3">
                        {[
                          { label: "Resume", link: selected.resumeLink },
                          { label: "CEFR Test Result", link: selected.cefrLink },
                        ].map(doc => (
                          <div key={doc.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                <FileText size={16} className="text-indigo-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{doc.label}</p>
                                <p className="text-xs text-slate-500">{doc.link ? "Uploaded to Google Drive" : "Not submitted"}</p>
                              </div>
                            </div>
                            {doc.link && (
                              <a href={doc.link} target="_blank" rel="noopener noreferrer">
                                <Btn variant="secondary" size="sm"><Eye size={13} /> View</Btn>
                              </a>
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
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            <ClipboardList size={11} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">Application submitted</p>
                            <p className="text-xs text-slate-500">{selected.name} · {selected.submittedAt ? new Date(selected.submittedAt).toLocaleString("en-PH") : "—"}</p>
                          </div>
                        </div>
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

// ─── Root App ─────────────────────────────────────────────────────────────────

import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
