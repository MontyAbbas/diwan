/**
 * Diwan Comments Backend — Google Apps Script
 * ============================================
 * Moderated reader letters for https://montyabbas.github.io/diwan/
 *
 * What it does:
 *  - Stores every submitted letter as PENDING in a Google Sheet
 *    ("Diwan Comments", created automatically in your Drive).
 *  - Emails you each new letter with one-click ✅ approve / 🚫 reject links.
 *  - Serves the APPROVED letters per poem to the website.
 *  - To hide a letter later: open the sheet and change its status
 *    to HIDDEN (or delete the row).
 *
 * SETUP (one time, ~5 minutes):
 *  1. Go to https://script.google.com → New project.
 *  2. Delete the placeholder code, paste this whole file, and change
 *     SECRET below to any random phrase of your own.
 *  3. Click Deploy → New deployment → type: Web app.
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Click Deploy and authorize when asked.
 *  4. Copy the web app URL (ends in /exec) and paste it into
 *     COMMENTS_ENDPOINT in index.html.
 */

var ADMIN_EMAIL = "montasir.abbas@gmail.com";
var SECRET = "CHANGE-THIS-to-your-own-random-secret";

function sheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SHEET_ID");
  var ss = null;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create("Diwan Comments");
    ss.getSheets()[0].appendRow(["id", "time", "poem", "name", "message", "status"]);
    props.setProperty("SHEET_ID", ss.getId());
  }
  return ss.getSheets()[0];
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function escHtml_(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.action !== "submit") return json_({ ok: false });
  if (p.website) return json_({ ok: true });   // honeypot field — bots fill it
  var msg   = String(p.message || "").trim().slice(0, 2000);
  var name  = String(p.name || "").trim().slice(0, 100) || "زائر";
  var poem  = String(p.poem || "").trim().slice(0, 100);
  var title = String(p.title || "").trim().slice(0, 200);
  if (!msg || !poem) return json_({ ok: false });

  var id = Utilities.getUuid();
  sheet_().appendRow([id, new Date().toISOString(), poem, name, msg, "PENDING"]);

  var base = ScriptApp.getService().getUrl();
  var approve = base + "?action=approve&id=" + id + "&token=" + encodeURIComponent(SECRET);
  var reject  = base + "?action=hide&id=" + id + "&token=" + encodeURIComponent(SECRET);
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: 'رسالة جديدة على "' + (title || poem) + '" — ' + name,
    htmlBody:
      "<div dir='rtl' style='font-size:16px;font-family:sans-serif'>" +
      "<p><b>القصيدة:</b> " + escHtml_(title || poem) + "</p>" +
      "<p><b>الاسم:</b> " + escHtml_(name) + "</p>" +
      "<p style='white-space:pre-wrap;border-right:3px solid #d9a441;padding-right:12px'>" +
      escHtml_(msg) + "</p><hr>" +
      "<p style='font-size:18px'><a href='" + approve + "'>&#9989; الموافقة والنشر</a>" +
      " &nbsp;&nbsp;|&nbsp;&nbsp; <a href='" + reject + "'>&#128683; رفض</a></p></div>"
  });
  return json_({ ok: true });
}

function doGet(e) {
  var p = (e && e.parameter) || {};

  if (p.action === "list") {
    var rows = sheet_().getDataRange().getValues();
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][5] === "APPROVED" && String(rows[i][2]) === String(p.poem || "")) {
        out.push({ name: rows[i][3], date: rows[i][1], text: rows[i][4] });
      }
    }
    return json_({ ok: true, comments: out });
  }

  if ((p.action === "approve" || p.action === "hide") && p.token === SECRET && p.id) {
    var sh = sheet_();
    var rows2 = sh.getDataRange().getValues();
    for (var j = 1; j < rows2.length; j++) {
      if (rows2[j][0] === p.id) {
        sh.getRange(j + 1, 6).setValue(p.action === "approve" ? "APPROVED" : "HIDDEN");
        return HtmlService.createHtmlOutput(
          "<div dir='rtl' style='font-family:sans-serif;text-align:center;margin-top:3em'><h2>" +
          (p.action === "approve" ? "&#9989; نُشرت الرسالة على الموقع" : "&#128683; أُخفيت الرسالة") +
          "</h2></div>");
      }
    }
    return HtmlService.createHtmlOutput("<h2>لم يتم العثور على الرسالة</h2>");
  }

  return json_({ ok: false });
}
