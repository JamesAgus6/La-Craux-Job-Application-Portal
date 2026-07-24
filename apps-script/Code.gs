const SPREADSHEET_ID = "1fx7AxOlmPxvGDm7c83pJWExRoZRzI-7cVXJ-Fu339nk";
const SHEET_NAME = "Applications";
const FOLDER_ID = "1PJM3dMBQkpkwQ5AOctktYu5Q1eROmSaf";
const FALLBACK_FOLDER_NAME = "La Craux Applications";

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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        "Submitted At", "Full Name", "Email", "Phone", "Date of Birth", "Gender",
        "City", "Province", "Source", "Position", "Referrer Name", "Referrer Dept",
        "Education Level", "Course", "School", "Campus", "Undergrad Year",
        "Industries", "Start Date", "Expected Salary", "Work Arrangements",
        "Vocaroo Link", "VEED Link", "Resume (Drive)", "CEFR Result (Drive)", "Stage"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }

    const folder = getOrCreateFolder();
    const appFolder = folder.createFolder(data.name + " — " + data.submittedAt);
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

    sheet.appendRow([
      data.submittedAt, data.name, data.email, data.phone, data.dob, data.gender,
      data.city, data.province, data.source, data.position,
      data.referrerName, data.referrerDept, data.eduLevel, data.course,
      data.school, data.campus, data.undergradYear, data.industries,
      data.startDate, data.salary, data.arrangements,
      data.vocaroo, data.veedLink, resumeLink, cefrLink, "applied"
    ]);

    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, error: err.toString() });
  }
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
