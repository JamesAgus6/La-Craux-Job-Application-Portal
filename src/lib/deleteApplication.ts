function getEndpoint(): string {
  const endpoint = (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)?.trim();
  if (!endpoint) {
    throw new Error("Set VITE_APPS_SCRIPT_URL in your .env.local file to your deployed Google Apps Script Web App URL.");
  }
  return endpoint;
}

export async function deleteApplication(target: { submittedAt: string; email: string }): Promise<void> {
  const endpoint = getEndpoint();

  await fetch(endpoint, {
    method: "POST",
    mode:   "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action:      "delete",
      submittedAt: target.submittedAt,
      email:       target.email,
    }),
  });

  // mode: 'no-cors' means we can't read the response — same tradeoff as
  // submitApplication.ts. The admin UI removes the row from local state
  // immediately; the next 30s poll will confirm it's actually gone from
  // the sheet.
}