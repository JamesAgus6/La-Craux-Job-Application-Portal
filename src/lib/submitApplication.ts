const ENDPOINT = (import.meta.env.VITE_APPS_SCRIPT_URL as string) ||
  "https://script.google.com/macros/s/AKfycbysKkNlKSXzsQuFMD0n6qJnai4W5VRG6sVHJW1seL7DEiQ7fg2zpiBaIhW-oVFsi8-z/exec";

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function submitApplication(form: Record<string, any>): Promise<void> {
  const payload: Record<string, any> = {
    submittedAt:   new Date().toISOString(),
    name:          form.name,
    email:         form.email,
    phone:         form.phone,
    dob:           form.dob,
    gender:        form.gender,
    city:          form.city,
    province:      form.province,
    source:        form.source,
    position:      form.position,
    referrerName:  form.referrerName,
    referrerDept:  form.referrerDept,
    eduLevel:      form.eduLevel,
    course:        form.course,
    school:        form.school,
    campus:        form.campus,
    undergradYear: form.undergradYear,
    industries:    (form.industries  || []).join(", "),
    startDate:     form.startDate,
    salary:        form.salary,
    arrangements:  (form.arrangements || []).join(", "),
    vocaroo:       form.vocaroo,
    veedLink:      form.veedLink,
  };

  if (form.resumeFile instanceof File) {
    payload.resumeBase64 = await toBase64(form.resumeFile);
    payload.resumeName   = form.resumeFile.name;
    payload.resumeType   = form.resumeFile.type;
  }

  if (form.cefrFile instanceof File) {
    payload.cefrBase64 = await toBase64(form.cefrFile);
    payload.cefrName   = form.cefrFile.name;
    payload.cefrType   = form.cefrFile.type;
  }

  // Apps Script doesn't handle CORS preflight for JSON content-type.
  // mode: 'no-cors' bypasses preflight — the POST still reaches doPost()
  // and writes to the sheet, but the response is opaque (unreadable).
  // Any network-level failure (no internet) will throw here.
  await fetch(ENDPOINT, {
    method: "POST",
    mode:   "no-cors",
    body:   JSON.stringify(payload),
  });
}
