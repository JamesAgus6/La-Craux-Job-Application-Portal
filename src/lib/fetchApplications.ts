const ENDPOINT = (import.meta.env.VITE_APPS_SCRIPT_URL as string) ||
  "https://script.google.com/macros/s/AKfycbysKkNlKSXzsQuFMD0n6qJnai4W5VRG6sVHJW1seL7DEiQ7fg2zpiBaIhW-oVFsi8-z/exec";

export interface Candidate {
  id: number;
  submittedAt: string;
  name: string;
  email: string;
  phone: string;
  viberNumber: string;
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
  const parts = name.split(" ").filter(Boolean).slice(0, 2);
  return parts.length ? parts.map(w => w[0].toUpperCase()).join("") : "?";
}

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStage(value: unknown) {
  const stage = normalize(value) || "applied";
  return stage === "final_interview" ? "initial_interview" : stage;
}

function hasMeaningfulApplicationData(row: Record<string, string>) {
  const submittedAt = normalize(row["Submitted At"]);
  const name = normalize(row["Full Name"]);
  const email = normalize(row["Email"]);
  const role = normalize(row["Position"]);
  const phone = normalize(row["Phone"]);

  if (!submittedAt) return false;

  const identityFields = [name, email, phone, role].filter(Boolean).length;
  return identityFields >= 2;
}

export async function fetchApplications(): Promise<Candidate[]> {
  // Apps Script GET requests follow a redirect — must allow it
  const res = await fetch(`${ENDPOINT}?action=get`, {
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const json = await res.json();
  const rows: Record<string, string>[] = json.data || [];
  // Filter out blank/placeholder rows and rows with no meaningful applicant data.
  const validRows = rows.filter(hasMeaningfulApplicationData);
  return validRows.map((r, i) => ({
    id:           i + 1,
    submittedAt:  r["Submitted At"] || "",
    name:         r["Full Name"]    || "",
    email:        r["Email"]        || "",
    phone:        r["Phone"]        || "",
    viberNumber:  r["Viber Number"] || r["viberNumber"] || "",
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
    stage:        normalizeStage(r["Stage"]),
    avatar:       initials(r["Full Name"] || "?"),
  }));
}
