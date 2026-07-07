import type { CycleData, DayEntry } from '../types/cycle';
import {
  FLOW_OPTIONS,
  getSymptomLabel,
} from '../constants/symptoms';
import { getPhaseById } from '../constants/cycleContent';
import { computeSymptomCorrelations, extractSymptomKeys } from './cycleInsights';
import { parseDateKey, daysBetween, addDays } from './dates';
import {
  computeAvgCycleLength,
  computeAvgPeriodDays,
  getPeriodStarts,
} from './cycleMath';
import { getCycleContextForDate } from './cyclePhase';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateShort(key: string): string {
  return parseDateKey(key).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function flowLabel(flow: DayEntry['flow']): string | null {
  if (!flow) return null;
  return FLOW_OPTIONS.find((f) => f.id === flow)?.label ?? flow;
}

function skinLabel(skin: DayEntry['skin']): string | null {
  if (!skin) return null;
  const map = { nickel: 'Peau : bonne', ok: 'Peau : correcte', acne: 'Peau : acné' };
  return map[skin];
}

function dischargeLabel(d: DayEntry['discharge']): string | null {
  if (!d) return null;
  return d === 'blanches' ? 'Pertes blanches' : 'Pertes marrones';
}

function formatDayDetails(entry: DayEntry): string[] {
  const lines: string[] = [];

  if (entry.period) {
    const flux = flowLabel(entry.flow);
    lines.push(flux ? `Règles (flux ${flux.toLowerCase()})` : 'Règles');
  }

  const discharge = dischargeLabel(entry.discharge);
  if (discharge) lines.push(discharge);

  const skin = skinLabel(entry.skin);
  if (skin) lines.push(skin);

  for (const key of extractSymptomKeys(entry)) {
    lines.push(getSymptomLabel(key));
  }

  if (entry.journal?.trim()) {
    lines.push(`Journal : « ${entry.journal.trim()} »`);
  }

  return lines;
}

function buildPeriodHistoryRows(data: CycleData): string {
  const starts = getPeriodStarts(data);
  if (starts.length === 0) {
    return '<tr><td colspan="4" class="muted">Aucune règle enregistrée</td></tr>';
  }

  return starts
    .map((start, i) => {
      let duration = 0;
      let d = start;
      while (data[d]?.period) {
        duration++;
        d = addDays(d, 1);
      }

      const nextStart = i + 1 < starts.length ? starts[i + 1] : null;
      const gap = nextStart ? daysBetween(start, nextStart) : null;

      return `<tr>
        <td>${escapeHtml(formatDateShort(start))}</td>
        <td>${duration} jour${duration > 1 ? 's' : ''}</td>
        <td>${gap !== null ? `${gap} jours` : '—'}</td>
        <td>${nextStart ? escapeHtml(formatDateShort(nextStart)) : 'Cycle en cours'}</td>
      </tr>`;
    })
    .join('');
}

function buildDailyLogRows(data: CycleData): string {
  const dates = Object.keys(data).sort();
  const logged = dates.filter((d) => formatDayDetails(data[d]).length > 0);

  if (logged.length === 0) {
    return '<tr><td colspan="3" class="muted">Aucun symptôme ou observation enregistré</td></tr>';
  }

  return logged
    .map((date) => {
      const entry = data[date];
      const ctx = getCycleContextForDate(data, date);
      const phase = ctx ? getPhaseById(ctx.phase).shortTitle : '—';
      const cycleDay = ctx ? `J${ctx.cycleDay}` : '—';
      const details = formatDayDetails(entry);

      return `<tr>
        <td class="nowrap">${escapeHtml(formatDateShort(date))}<br/><span class="sub">${cycleDay}</span></td>
        <td>${escapeHtml(phase)}</td>
        <td>${details.map((l) => `• ${escapeHtml(l)}`).join('<br/>')}</td>
      </tr>`;
    })
    .join('');
}

function buildInsightsList(data: CycleData): string {
  const { insights, ready } = computeSymptomCorrelations(data);
  if (!ready || insights.length === 0) {
    return '<p class="muted">Pas assez de cycles pour établir des corrélations fiables (minimum 3 débuts de règles).</p>';
  }

  return `<ul class="insights">${insights
    .slice(0, 10)
    .map((i) => `<li>${escapeHtml(i.sentence)}</li>`)
    .join('')}</ul>`;
}

export function buildMedicalReportHtml(data: CycleData, userEmail?: string): string {
  const generatedAt = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const starts = getPeriodStarts(data);
  const dates = Object.keys(data).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const avgCycle = computeAvgCycleLength(data);
  const avgPeriod = computeAvgPeriodDays(data);
  const loggedDays = dates.filter((d) => formatDayDetails(data[d]).length > 0).length;

  const summaryItems = [
    `<strong>Période couverte :</strong> ${firstDate && lastDate ? `${formatDateShort(firstDate)} → ${formatDateShort(lastDate)}` : '—'}`,
    `<strong>Jours renseignés :</strong> ${loggedDays}`,
    `<strong>Cycles enregistrés :</strong> ${starts.length}`,
    `<strong>Durée moyenne du cycle :</strong> ${starts.length >= 2 ? `~${avgCycle} jours` : 'Données insuffisantes'}`,
    `<strong>Durée moyenne des règles :</strong> ${starts.length >= 1 ? `~${avgPeriod} jours` : '—'}`,
  ];

  if (userEmail) {
    summaryItems.unshift(`<strong>Compte :</strong> ${escapeHtml(userEmail)}`);
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #2d2428;
      font-size: 11pt;
      line-height: 1.45;
      margin: 0;
      padding: 32px 36px;
    }
    .header {
      border-bottom: 3px solid #B85C6E;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 22pt;
      color: #B85C6E;
      margin: 0 0 6px 0;
      font-weight: 700;
    }
    .subtitle {
      color: #6b5d64;
      font-size: 10pt;
      margin: 0;
    }
    h2 {
      font-size: 13pt;
      color: #4A3F47;
      margin: 28px 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #E8DFD6;
    }
    .summary {
      background: #FBF7F2;
      border: 1px solid #E8DFD6;
      border-radius: 8px;
      padding: 14px 18px;
    }
    .summary p { margin: 6px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10pt;
    }
    th {
      background: #F3EBE3;
      color: #4A3F47;
      font-weight: 600;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #E8DFD6;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #E8DFD6;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #FFFCF9; }
    .muted { color: #9A8B94; font-style: italic; }
    .sub { font-size: 9pt; color: #9A8B94; }
    .nowrap { white-space: nowrap; }
    .insights { margin: 8px 0; padding-left: 20px; }
    .insights li { margin-bottom: 6px; }
    .disclaimer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #E8DFD6;
      font-size: 9pt;
      color: #9A8B94;
      line-height: 1.5;
    }
    .brand { font-weight: 600; color: #B85C6E; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport de suivi menstruel</h1>
    <p class="subtitle">Document généré le ${escapeHtml(generatedAt)} · <span class="brand">Floraison</span></p>
  </div>

  <h2>Synthèse</h2>
  <div class="summary">
    ${summaryItems.map((item) => `<p>${item}</p>`).join('')}
  </div>

  <h2>Historique des règles</h2>
  <table>
    <thead>
      <tr>
        <th>Début des règles</th>
        <th>Durée</th>
        <th>Cycle (jusqu'au suivant)</th>
        <th>Règles suivantes</th>
      </tr>
    </thead>
    <tbody>
      ${buildPeriodHistoryRows(data)}
    </tbody>
  </table>

  <h2>Journal des observations</h2>
  <p class="muted" style="margin-top:0">Symptômes, humeur, sommeil et notes déclarés par la patiente.</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Phase du cycle</th>
        <th>Observations</th>
      </tr>
    </thead>
    <tbody>
      ${buildDailyLogRows(data)}
    </tbody>
  </table>

  <h2>Tendances observées</h2>
  ${buildInsightsList(data)}

  <div class="disclaimer">
    <strong>Note pour le professionnel de santé :</strong>
    Ce document repose sur un auto-suivi déclaratif (application Floraison).
    Les prédictions de cycle utilisent une phase lutéale estimée à 14 jours et des moyennes calculées
    sur l'historique disponible. Ce rapport ne constitue pas un diagnostic et doit être interprété
    dans le contexte clinique global de la patiente.
  </div>
</body>
</html>`;
}
