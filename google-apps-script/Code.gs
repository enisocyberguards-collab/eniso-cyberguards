/**
 * ENISo CyberGuards — Réception des candidatures dans Google Sheets.
 *
 * INSTALLATION :
 * 1. Crée un Google Sheet vide, nomme la première feuille "Candidatures".
 * 2. Dans le Sheet : Extensions > Apps Script.
 * 3. Supprime le code par défaut et colle tout ce fichier.
 * 4. Déploie : Déployer > Nouveau déploiement > type "Application Web".
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 * 5. Copie l'URL du Web App fournie (se termine par /exec).
 * 6. Colle cette URL dans la variable GOOGLE_SCRIPT_URL sur Vercel.
 */

const SHEET_NAME = "Candidatures";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('Feuille "' + SHEET_NAME + '" introuvable.');
    }

    // Ajoute les en-têtes si la feuille est vide
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Nom", "Email", "Filière", "Motivation"]);
    }

    sheet.appendRow([
      data.date || new Date().toISOString(),
      data.nom || "",
      data.email || "",
      data.filiere || "",
      data.motivation || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
