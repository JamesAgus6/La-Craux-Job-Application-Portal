function getEndpoint(): string {
  const endpoint = (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)?.trim();
  if (!endpoint) {
    throw new Error("Set VITE_APPS_SCRIPT_URL in your .env.local file to your deployed Google Apps Script Web App URL.");
  }
  return endpoint;
}

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
    action:        "submit",
    submittedAt:   new Date().toISOString(),
    name:          form.name,
    email:         form.email,
    phone:         form.phone,
    viberNumber:   form.viberNumber,
    dob:           form.dob,
    gender:        form.gender,
    city:          form.city,
    province:      form.province,
    source:        form.source,
    sourceOther:   form.source === "Other" ? form.sourceOther : "",
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

  const endpoint = getEndpoint();

  // IMPORTANT — this was the bug causing submissions to not show up in the sheet:
  // Apps Script Web Apps don't handle CORS preflight (OPTIONS) requests. Any
  // fetch() with a Content-Type that isn't CORS-safelisted (like
  // "application/json") combined with mode: 'no-cors' is unreliable across
  // browsers — some silently fail to actually deliver the body, since
  // 'no-cors' mode restricts requests to "simple request" headers only.
  //
  // Fix: use "text/plain;charset=utf-8", which IS CORS-safelisted, so this
  // is guaranteed to be sent as a simple request (no preflight attempted,
  // nothing dropped). Apps Script just reads e.postData.contents as a raw
  // string and JSON.parses it itself, so the declared Content-Type doesn't
  // matter on that end.
  const res = await fetch(endpoint, {
    method: "POST",
    mode:   "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body:   JSON.stringify(payload),
  });

  // mode: 'no-cors' makes the response opaque (status is always 0, body is
  // unreadable), so success can't be confirmed from the response itself.
  // Any network-level failure (offline, DNS, blocked request) still throws
  // above and is caught by the caller.
  void res;
}