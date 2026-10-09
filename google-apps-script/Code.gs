const SHEET_NAME = "Candidatures";
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Feuille "' + SHEET_NAME + '" introuvable.');
    if (sheet.getLastRow() === 0) sheet.appendRow(["Date", "Nom complet", "Email", "Téléphone", "Filière", "Pourquoi pas au premier appel ?", "Motivation"]);
    sheet.appendRow([data.date || new Date().toISOString(), data.nom || "", data.email || "", data.telephone || "", data.filiere || "", data.pourquoi || "", data.motivation || ""]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) { return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON); }
}
