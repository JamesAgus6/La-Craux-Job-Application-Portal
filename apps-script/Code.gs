const SPREADSHEET_ID = "1fx7AxOlmPxvGDm7c83pJWExRoZRzI-7cVXJ-Fu339nk";
const SHEET_NAME = "Applications";
const FOLDER_ID = "1PJM3dMBQkpkwQ5AOctktYu5Q1eROmSaf";
const FALLBACK_FOLDER_NAME = "La Craux Applications";

const HEADERS = [
  "Submitted At", "Full Name", "Email", "Phone", "Viber Number", "Date of Birth", "Gender",
  "City", "Province", "Source", "Source Other", "Position", "Referrer Name", "Referrer Dept",
  "Education Level", "Course", "School", "Campus", "Undergrad Year",
  "Industries", "Start Date", "Expected Salary", "Work Arrangements",
  "Vocaroo Link", "VEED Link", "Resume (Drive)", "CEFR Result (Drive)", "Stage"
];

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return jsonOut({ data: [] });

    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return jsonOut({ data: [] });

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, j) => {
        obj[h] = row[j] ?? "";
      });
      return obj;
    });

    return jsonOut({ data });
  } catch (err) {
    return jsonOut({ data: [], error: err.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "submit";

    if (action === "delete") {
      return handleDelete(data);
    }

    return handleSubmit(data);
  } catch (err) {
    return jsonOut({ success: false, error: err.toString() });
  }
}

function getOrCreateSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    return sheet;
  }
  ensureHeaderColumns(sheet);
  return sheet;
}

// Adds any headers from HEADERS that are missing from an existing sheet,
// appending them as new columns at the end (safe — never reorders or
// deletes existing columns, so old data stays aligned).
function ensureHeaderColumns(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const missing = HEADERS.filter(h => headerRow.indexOf(h) === -1);
  if (missing.length === 0) return;

  let nextCol = lastCol + 1;
  missing.forEach(h => {
    sheet.getRange(1, nextCol).setValue(h);
    nextCol++;
  });
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");
}

function handleSubmit(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet(ss);

  const folder = getOrCreateFolder();
  const appFolder = folder.createFolder((data.name || "Applicant") + " — " + data.submittedAt);
  let resumeLink = "";
  let cefrLink = "";

  if (data.resumeBase64) {
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.resumeBase64),
      data.resumeType,
      data.resumeName
    );
    const file = appFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    resumeLink = file.getUrl();
  }

  if (data.cefrBase64) {
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.cefrBase64),
      data.cefrType,
      data.cefrName
    );
    const file = appFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    cefrLink = file.getUrl();
  }

  // Build the row in the exact order of the current header row, so this
  // still works correctly even after ensureHeaderColumns() has appended
  // new columns at the end for older sheets.
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const valueByHeader = {
    "Submitted At":        data.submittedAt,
    "Full Name":           data.name,
    "Email":               data.email,
    "Phone":               data.phone,
    "Viber Number":        data.viberNumber || "",
    "Date of Birth":       data.dob,
    "Gender":              data.gender,
    "City":                data.city,
    "Province":            data.province,
    "Source":              data.source,
    "Source Other":        data.sourceOther || "",
    "Position":            data.position,
    "Referrer Name":       data.referrerName,
    "Referrer Dept":       data.referrerDept,
    "Education Level":     data.eduLevel,
    "Course":              data.course,
    "School":              data.school,
    "Campus":              data.campus,
    "Undergrad Year":      data.undergradYear,
    "Industries":          data.industries,
    "Start Date":          data.startDate,
    "Expected Salary":     data.salary,
    "Work Arrangements":   data.arrangements,
    "Vocaroo Link":        data.vocaroo,
    "VEED Link":           data.veedLink,
    "Resume (Drive)":      resumeLink,
    "CEFR Result (Drive)": cefrLink,
    "Stage":               "applied",
  };

  const row = headerRow.map(h => (valueByHeader[h] !== undefined ? valueByHeader[h] : ""));
  sheet.appendRow(row);

  return jsonOut({ success: true });
}

// Deletes the sheet row matching the given Submitted At + Email pair.
// This pairing is what the admin dashboard sends back, since rows don't
// otherwise have a stable ID in the sheet itself.
function handleDelete(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return jsonOut({ success: false, error: "Applications sheet not found." });

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return jsonOut({ success: false, error: "No applications to delete." });

  const headers = values[0];
  const submittedAtCol = headers.indexOf("Submitted At");
  const emailCol = headers.indexOf("Email");
  if (submittedAtCol === -1 || emailCol === -1) {
    return jsonOut({ success: false, error: "Sheet is missing expected columns." });
  }

  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i];
    if (String(row[submittedAtCol]) === String(data.submittedAt) && String(row[emailCol]) === String(data.email)) {
      sheet.deleteRow(i + 1); // +1 because getDataRange() is 0-indexed but sheet rows are 1-indexed
      return jsonOut({ success: true });
    }
  }

  return jsonOut({ success: false, error: "Matching application not found." });
}

function getOrCreateFolder() {
  try {
    return DriveApp.getFolderById(FOLDER_ID);
  } catch (err) {
    const it = DriveApp.getFoldersByName(FALLBACK_FOLDER_NAME);
    return it.hasNext() ? it.next() : DriveApp.createFolder(FALLBACK_FOLDER_NAME);
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}