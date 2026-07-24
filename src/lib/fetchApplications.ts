const ENDPOINT = (import.meta.env.VITE_APPS_SCRIPT_URL as string) ||
  "https://script.google.com/macros/s/AKfycbysKkNlKSXzsQuFMD0n6qJnai4W5VRG6sVHJW1seL7DEiQ7fg2zpiBaIhW-oVFsi8-z/exec";

export interface Candidate {
  id: number;
  submittedAt: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  city: string;
  province: string;
  source: string;
  role: string;
  referrerName: string;
  referrerDept: string;
  eduLevel: string;
  course: string;
  school: string;
  campus: string;
  undergradYear: string;
  industries: string;
  startDate: string;
  salary: string;
  arrangements: string;
  vocaroo: string;
  veedLink: string;
  resumeLink: string;
  cefrLink: string;
  stage: string;
  avatar: string;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

export async function fetchApplications(): Promise<Candidate[]> {
  // Apps Script GET requests follow a redirect — must allow it
  const res = await fetch(`${ENDPOINT}?action=get`, {
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const json = await res.json();
  const rows: Record<string, string>[] = json.data || [];
  return rows.map((r, i) => ({
    id:           i + 1,
    submittedAt:  r["Submitted At"] || "",
    name:         r["Full Name"]    || "",
    email:        r["Email"]        || "",
    phone:        r["Phone"]        || "",
    dob:          r["Date of Birth"]|| "",
    gender:       r["Gender"]       || "",
    city:         r["City"]         || "",
    province:     r["Province"]     || "",
    source:       r["Source"]       || "",
    role:         r["Position"]     || "",
    referrerName: r["Referrer Name"]|| "",
    referrerDept: r["Referrer Dept"]|| "",
    eduLevel:     r["Education Level"] || "",
    course:       r["Course"]       || "",
    school:       r["School"]       || "",
    campus:       r["Campus"]       || "",
    undergradYear:r["Undergrad Year"]|| "",
    industries:   r["Industries"]   || "",
    startDate:    r["Start Date"]   || "",
    salary:       r["Expected Salary"] || "",
    arrangements: r["Work Arrangements"] || "",
    vocaroo:      r["Vocaroo Link"] || "",
    veedLink:     r["VEED Link"]    || "",
    resumeLink:   r["Resume (Drive)"] || "",
    cefrLink:     r["CEFR Result (Drive)"] || "",
    stage:        r["Stage"]        || "applied",
    avatar:       initials(r["Full Name"] || "?"),
  }));
}
