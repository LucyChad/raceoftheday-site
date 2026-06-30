// ============================================================
// RACE OF THE DAY — Send Tips
//
// Install: open the master tip log Google Sheet
//          Extensions > Apps Script > paste this entire file > Save
//
// Usage: a new menu "ROTD" appears in the sheet toolbar.
//        Enter today's tips in the sheet, then click ROTD > Send Today's Tips.
// ============================================================

// ---- CONFIG (update if needed) ----
const NETLIFY_ENDPOINT = 'https://raceoftheday.com/.netlify/functions/send-daily-tip';
const TIP_SECRET = 'REPLACE_WITH_DAILY_TIP_SECRET'; // must match DAILY_TIP_SECRET in Netlify env vars
const SHEET_TAB_NAME = '';  // Leave blank to use the first sheet, or set e.g. 'Tips'
// ---- END CONFIG ----

// Column indices (0-based): A=0, B=1, C=2, D=3, E=4, F=5, G=6, L=11, M=12
const COL = { DATE: 0, COURSE: 1, TIME: 2, HORSE: 3, COUNTRY: 4, BET_TYPE: 5, STAKE: 6, OUTCOME: 11, PNL: 12 };

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ROTD')
    .addItem("Send Today's Tips", 'sendTodaysTips')
    .addToUi();
}

function getDataSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (SHEET_TAB_NAME) {
    const s = ss.getSheetByName(SHEET_TAB_NAME);
    if (!s) throw new Error('Sheet tab "' + SHEET_TAB_NAME + '" not found. Update SHEET_TAB_NAME in the script.');
    return s;
  }
  return ss.getSheets()[0];
}

function dateToString(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
  return String(d).trim();
}

function isSameDate(cellVal, dateStr) {
  return dateToString(cellVal) === dateStr;
}

function sendTodaysTips() {
  const ui = SpreadsheetApp.getUi();

  let sheet;
  try {
    sheet = getDataSheet();
  } catch (e) {
    ui.alert('Error', e.message, ui.ButtonSet.OK);
    return;
  }

  const data = sheet.getDataRange().getValues();
  // Skip header row (row 0 assumed to be headers)
  const rows = data.slice(1).filter(row => row[COL.HORSE]);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = dateToString(today);
  const yesterdayStr = dateToString(yesterday);

  // Today's tips (date = today, horse filled, no outcome yet)
  const todayRows = rows.filter(row => isSameDate(row[COL.DATE], todayStr));

  if (todayRows.length === 0) {
    ui.alert('No tips found for today (' + todayStr + ').\n\nMake sure today\'s rows have the correct date in column A.');
    return;
  }

  // Group into race blocks by course + time
  const raceMap = new Map();
  todayRows.forEach(row => {
    const key = row[COL.COURSE] + '|' + row[COL.TIME];
    if (!raceMap.has(key)) {
      raceMap.set(key, { course: String(row[COL.COURSE]).trim(), time: String(row[COL.TIME]).trim(), horses: [] });
    }
    raceMap.get(key).horses.push({
      horse: String(row[COL.HORSE]).trim(),
      betType: String(row[COL.BET_TYPE]).trim(),
      stake: String(row[COL.STAKE]).trim()
    });
  });
  const races = Array.from(raceMap.values());

  // Yesterday's completed results
  const yesterdayRows = rows.filter(row =>
    isSameDate(row[COL.DATE], yesterdayStr) && row[COL.OUTCOME]
  );

  // Running stats (all rows with outcomes)
  const allResults = rows.filter(row => row[COL.OUTCOME]);
  const totalSelections = allResults.length;
  const wins = allResults.filter(row => ['win', 'place'].includes(String(row[COL.OUTCOME]).toLowerCase())).length;
  const winRate = totalSelections > 0 ? Math.round((wins / totalSelections) * 100) + '%' : '0%';
  const runningPtsRaw = allResults.reduce((sum, row) => {
    const v = parseFloat(row[COL.PNL]);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
  const runningPts = (runningPtsRaw >= 0 ? '+' : '') + runningPtsRaw.toFixed(2);

  // Confirmation dialog
  const raceList = races.map(r =>
    r.course + ' ' + r.time + ': ' + r.horses.map(h => h.horse + ' (' + h.betType + ')').join(', ')
  ).join('\n');

  const confirm = ui.alert(
    "Send Today's Tips?",
    'Date: ' + todayStr + '\n\n' + raceList + '\n\nSend to all founding members?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  // Optional intro note from Frank
  const introPrompt = ui.inputBox(
    'Intro note (optional)',
    "Add a note from Frank, or press OK to use the default:",
    ui.ButtonSet.OK_CANCEL
  );
  if (introPrompt.getSelectedButton() === ui.Button.CANCEL) return;

  const introNote = introPrompt.getResponseText().trim() ||
    "Frank's selections for today. Please check the going and confirm odds before placing.";

  // Format date nicely
  const niceDate = today.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const subject = 'Race Of The Day · ' + niceDate;

  // Build outputs
  const emailHtml = buildEmailHtml({ date: niceDate, introNote, races, yesterdayRows, runningPts, winRate, totalSelections });
  const whatsappText = buildWhatsApp(niceDate, races, introNote);

  // Fire
  try {
    const response = UrlFetchApp.fetch(NETLIFY_ENDPOINT, {
      method: 'POST',
      contentType: 'application/json',
      headers: { 'x-tip-secret': TIP_SECRET },
      payload: JSON.stringify({ emailHtml, subject, whatsappText }),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    const body = response.getContentText();

    if (code === 200) {
      const result = JSON.parse(body);
      ui.alert(
        'Tips sent!',
        'Email delivered to ' + result.sent + ' members.' +
        (result.failed > 0 ? '\n\n' + result.failed + ' failed — check Netlify logs.' : ''),
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('Error', 'HTTP ' + code + ': ' + body, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('Error', 'Could not reach the server:\n' + e.message, ui.ButtonSet.OK);
  }
}

// ---- Email renderer ----

function buildRaceBlocks(races) {
  return races.map(race => {
    const horseRows = race.horses.map(h => `
        <tr>
          <td style="padding: 12px 20px; border-bottom: 1px solid #f0f0f0;">
            <div style="font-size: 16px; font-weight: 700; color: #111111; text-transform: uppercase; letter-spacing: 0.02em;">${h.horse}</div>
            <div style="font-size: 13px; color: #888888; margin-top: 3px;">
              <strong style="color: #444444;">${h.betType}</strong> &nbsp;·&nbsp; Stake: <strong style="color: #444444;">${h.stake} pts</strong>
            </div>
          </td>
        </tr>`).join('');

    return `
  <tr>
    <td style="padding: 0 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 0 0; border: 1px solid #e8e8e8; border-left: 3px solid #E8235A;">
        <tr>
          <td style="padding: 12px 20px; background: #F4F2EE; border-bottom: 1px solid #e8e8e8;">
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #E8235A; display: block; margin-bottom: 2px;">${race.course}</span>
            <span style="font-size: 17px; font-weight: 700; color: #111111;">${race.time}</span>
          </td>
        </tr>
        ${horseRows}
      </table>
    </td>
  </tr>`;
  }).join('');
}

function buildResultRows(yesterdayRows) {
  if (!yesterdayRows || yesterdayRows.length === 0) {
    return '<p style="font-size: 13px; color: #888888; margin: 0;">No selections yesterday.</p>';
  }
  return yesterdayRows.map(row => {
    const outcome = String(row[COL.OUTCOME]).toLowerCase();
    const isPositive = outcome === 'win' || outcome === 'place';
    const pnl = parseFloat(row[COL.PNL]);
    const pnlStr = isNaN(pnl) ? '' : (pnl >= 0 ? '+' + pnl.toFixed(2) : pnl.toFixed(2));
    return `
      <div style="margin-bottom: 8px;">
        <span style="font-size: 14px; font-weight: 700; color: #111111;">${row[COL.HORSE]}</span>
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-left: 8px; color: ${isPositive ? '#15803d' : '#888888'};">${row[COL.OUTCOME]}</span>
        ${pnlStr ? `<span style="font-size: 13px; color: #888888; margin-left: 6px;">${pnlStr} pts</span>` : ''}
      </div>`;
  }).join('');
}

function buildEmailHtml({ date, introNote, races, yesterdayRows, runningPts, winRate, totalSelections }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Race Of The Day · ${date}</title>
</head>
<body style="margin: 0; padding: 0; background: #F4F2EE; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111111;">
<div style="width: 100%; background: #F4F2EE;">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-collapse: collapse;">

  <tr>
    <td style="background: #111111; padding: 24px 32px; border-bottom: 3px solid #E8235A;">
      <div style="font-weight: 700; font-size: 20px; text-transform: uppercase; letter-spacing: 0.08em; color: #ffffff;">Race Of The Day</div>
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #888888; margin-top: 4px;">${date} &nbsp;·&nbsp; Frank's Daily Selections</div>
    </td>
  </tr>

  <tr>
    <td style="padding: 24px 32px 0 32px; background: #ffffff;">
      <p style="font-size: 15px; color: #444444; line-height: 1.7; margin: 0;">${introNote}</p>
    </td>
  </tr>

  ${buildRaceBlocks(races)}

  <tr>
    <td style="background: #F4F2EE; padding: 20px 32px; margin-top: 24px; border-top: 1px solid #e8e8e8;">
      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #888888; margin-bottom: 14px; display: block;">Place your bets, one click</span>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 4px 8px 4px 0;"><a href="https://www.paddypower.com/horse-racing" style="display: inline-block; padding: 9px 16px; background: #E8235A; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 100px;">Paddy Power</a></td>
          <td style="padding: 4px 8px 4px 0;"><a href="https://www.skybet.com/horse-racing" style="display: inline-block; padding: 9px 16px; background: #E8235A; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 100px;">Sky Bet</a></td>
          <td style="padding: 4px 8px 4px 0;"><a href="https://www.ladbrokes.com" style="display: inline-block; padding: 9px 16px; background: #E8235A; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 100px;">Ladbrokes</a></td>
          <td style="padding: 4px 8px 4px 0;"><a href="https://www.coral.co.uk" style="display: inline-block; padding: 9px 16px; background: #E8235A; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 100px;">Coral</a></td>
        </tr>
        <tr>
          <td style="padding: 4px 8px 4px 0;"><a href="https://www.williamhill.com" style="display: inline-block; padding: 9px 16px; background: #E8235A; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 100px;">William Hill</a></td>
          <td style="padding: 4px 8px 4px 0;"><a href="https://www.betfair.com/sport/horse-racing" style="display: inline-block; padding: 9px 16px; background: #E8235A; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 100px;">Betfair</a></td>
          <td style="padding: 4px 8px 4px 0;"><a href="https://www.bet365.com" style="display: inline-block; padding: 9px 16px; background: #E8235A; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 100px;">Bet365</a></td>
          <td></td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding: 20px 32px; border-top: 1px solid #e8e8e8; background: #ffffff;">
      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #888888; margin-bottom: 10px; display: block;">Yesterday's results</span>
      ${buildResultRows(yesterdayRows)}
    </td>
  </tr>

  <tr>
    <td style="background: #111111; padding: 20px 32px; border-top: 1px solid #e8e8e8;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 24px;">
            <span style="font-weight: 700; font-size: 22px; color: #4ADE80; display: block; line-height: 1;">${runningPts}</span>
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888; margin-top: 3px; display: block;">Points profit</span>
          </td>
          <td style="padding-right: 24px;">
            <span style="font-weight: 700; font-size: 22px; color: #4ADE80; display: block; line-height: 1;">${winRate}</span>
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888; margin-top: 3px; display: block;">Win rate</span>
          </td>
          <td>
            <span style="font-weight: 700; font-size: 22px; color: #4ADE80; display: block; line-height: 1;">${totalSelections}</span>
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888; margin-top: 3px; display: block;">Selections to date</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding: 20px 32px; background: #F4F2EE; border-top: 1px solid #e8e8e8;">
      <p style="font-size: 12px; color: #888888; line-height: 1.6; margin: 0 0 8px 0;">You're receiving this because you're a Race Of The Day member. Questions? Reply to this email or write to <a href="mailto:hello@raceoftheday.com" style="color: #555555;">hello@raceoftheday.com</a></p>
      <p style="font-size: 11px; color: #aaaaaa; margin: 0;"><a href="https://raceoftheday.com/unsubscribe" style="color: #aaaaaa;">Unsubscribe</a> &nbsp;·&nbsp; <a href="https://raceoftheday.com/privacy-policy" style="color: #aaaaaa;">Privacy Policy</a> &nbsp;·&nbsp; <a href="https://raceoftheday.com/terms" style="color: #aaaaaa;">Terms &amp; Conditions</a></p>
    </td>
  </tr>

  <tr>
    <td style="background: #111111; border-top: 1px solid #222222; padding: 20px 32px;">
      <div style="margin-bottom: 10px;">
        <span style="display: inline-block; font-size: 11px; font-weight: 700; color: #fff; border: 1.5px solid #fff; padding: 1px 5px; margin-right: 8px; line-height: 1.4; vertical-align: middle;">18+</span>
        <a href="https://www.begambleaware.org" style="color: #ffffff; text-decoration: underline; font-size: 12px;">BeGambleAware.org</a>
      </div>
      <p style="font-size: 12px; color: #aaaaaa; margin: 6px 0;">National Gambling Helpline: <strong style="color: #ffffff;">0808 8020 133</strong></p>
      <p style="font-size: 11px; color: #666666; line-height: 1.7; margin-top: 8px;">Race Of The Day provides horse racing selections for informational and entertainment purposes only. Past performance does not guarantee future results. Please bet responsibly. If gambling is affecting you or someone you know, visit <a href="https://www.begambleaware.org" style="color: #888888;">BeGambleAware.org</a> or call the National Gambling Helpline on 0808 8020 133.</p>
    </td>
  </tr>

</table>
</div>
</body>
</html>`;
}

// ---- WhatsApp renderer ----

function buildWhatsApp(date, races, introNote) {
  const lines = races.map(r =>
    r.horses.map(h =>
      `*${h.horse}*\n${r.course} · ${r.time} · ${h.betType} · ${h.stake}pt stake`
    ).join('\n')
  ).join('\n\n');

  return `🏇 *Race Of The Day · ${date}*\n\n${introNote}\n\n${lines}\n\nGood luck today.\n\nReply STOP to unsubscribe.`;
}
