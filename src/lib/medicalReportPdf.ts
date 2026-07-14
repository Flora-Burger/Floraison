import type { CycleData, Flow, InsightPhaseId } from '../types/cycle';
import { FLOW_OPTIONS, getSymptomLabel } from '../constants/symptoms';
import { getPhaseById } from '../constants/cycleContent';
import {
  computeSymptomCorrelations,
  extractSymptomKeys,
  isEmptyDayEntry,
  type SymptomInsight,
} from './cycleInsights';
import { parseDateKey, daysBetween, addDays, todayKey } from './dates';
import {
  computeAvgCycleLength,
  computeAvgPeriodDays,
  getCycleRegularity,
  getPeriodStarts,
} from './cycleMath';
import { getCycleContextForDate } from './cyclePhase';
import { formatNextPeriodLabel } from './cyclePredictions';

const FLOW_RANK: Record<Flow, number> = {
  leger: 1,
  moyen: 2,
  fort: 3,
  tres_abondant: 4,
};

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

function formatDateLong(key: string): string {
  return parseDateKey(key).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function flowLabel(flow: Flow | undefined): string | null {
  if (!flow) return null;
  return FLOW_OPTIONS.find((f) => f.id === flow)?.label ?? flow;
}

function phaseLabelForInsight(phase: InsightPhaseId): string {
  if (phase === 'avant_regles') return 'Semaine avant règles';
  return getPhaseById(phase).shortTitle;
}

function getPeriodBlockInfo(
  data: CycleData,
  start: string,
): { duration: number; end: string; maxFlow: Flow | null; maxFlowLabel: string | null } {
  let duration = 0;
  let maxFlow: Flow | null = null;
  let d = start;
  while (data[d]?.period) {
    duration++;
    const f = data[d]?.flow;
    if (f && (!maxFlow || FLOW_RANK[f] > FLOW_RANK[maxFlow])) {
      maxFlow = f;
    }
    d = addDays(d, 1);
  }
  return {
    duration,
    end: addDays(start, duration - 1),
    maxFlow,
    maxFlowLabel: maxFlow ? flowLabel(maxFlow) : null,
  };
}


function buildCycleSummaryItems(
  data: CycleData,
  userEmail: string | undefined,
  firstDate: string | undefined,
  lastDate: string | undefined,
  loggedDays: number,
): string[] {
  const starts = getPeriodStarts(data);
  const regularity = getCycleRegularity(data);
  const avgCycle = computeAvgCycleLength(data);
  const avgPeriod = computeAvgPeriodDays(data);
  const nextPeriod = formatNextPeriodLabel(data, todayKey());
  const heavyFlowDays = Object.entries(data).filter(
    ([, e]) => e.period && (e.flow === 'fort' || e.flow === 'tres_abondant'),
  ).length;

  const items: string[] = [];

  if (userEmail) {
    items.push(`<strong>Compte :</strong> ${escapeHtml(userEmail)}`);
  }

  items.push(
    `<strong>Période de suivi :</strong> ${
      firstDate && lastDate
        ? `${formatDateShort(firstDate)} → ${formatDateShort(lastDate)}`
        : '—'
    }`,
    `<strong>Jours renseignés :</strong> ${loggedDays}`,
    `<strong>Cycles enregistrés :</strong> ${starts.length}`,
    `<strong>Durée moyenne du cycle :</strong> ${
      starts.length >= 2 ? `~${avgCycle} jours` : 'Données insuffisantes (≥ 2 cycles requis)'
    }`,
  );

  if (regularity.status !== 'insufficient') {
    items.push(`<strong>Régularité :</strong> ${regularity.label}`);
  }

  items.push(
    `<strong>Durée moyenne des règles :</strong> ${
      starts.length >= 1 ? `~${avgPeriod} jours` : '—'
    }`,
  );

  if (nextPeriod) {
    items.push(`<strong>Prochaines règles (estimation) :</strong> ${escapeHtml(nextPeriod)}`);
  }

  if (heavyFlowDays > 0) {
    items.push(
      `<strong>Jours à flux fort / très abondant :</strong> ${heavyFlowDays} (sur la période suivie)`,
    );
  }

  return items;
}

function buildPeriodHistoryRows(data: CycleData): string {
  const starts = getPeriodStarts(data);
  if (starts.length === 0) {
    return '<tr><td colspan="5" class="muted">Aucune règle enregistrée</td></tr>';
  }

  return starts
    .map((start, i) => {
      const block = getPeriodBlockInfo(data, start);
      const nextStart = i + 1 < starts.length ? starts[i + 1] : null;
      const gap = nextStart ? daysBetween(start, nextStart) : null;

      return `<tr>
        <td class="nowrap">${escapeHtml(formatDateShort(start))}</td>
        <td class="nowrap">${escapeHtml(formatDateShort(block.end))}</td>
        <td>${block.duration} j</td>
        <td>${block.maxFlowLabel ?? '—'}</td>
        <td>${gap !== null ? `${gap} j` : '—'}</td>
      </tr>`;
    })
    .join('');
}

function buildInsightRows(insights: SymptomInsight[]): string {
  if (insights.length === 0) {
    return '<tr><td colspan="4" class="muted">Pas assez de données pour établir des tendances fiables (symptômes récurrents sur plusieurs cycles).</td></tr>';
  }

  return insights
    .map((i) => {
      const pct = Math.round(i.rate * 100);
      const reliability = i.confidence === 'tentative' ? 'À confirmer' : 'Confirmé';
      return `<tr>
        <td>${escapeHtml(i.label)}</td>
        <td>${escapeHtml(phaseLabelForInsight(i.phase))}</td>
        <td>${pct} %</td>
        <td>${i.evidenceDays} j · ${reliability}</td>
      </tr>`;
    })
    .join('');
}

type SymptomStat = {
  label: string;
  count: number;
  phases: Map<string, number>;
};

function buildSymptomStats(data: CycleData): SymptomStat[] {
  const stats = new Map<string, SymptomStat>();

  for (const [date, entry] of Object.entries(data)) {
    if (isEmptyDayEntry(entry)) continue;
    const ctx = getCycleContextForDate(data, date);
    const phaseName = ctx ? getPhaseById(ctx.phase).shortTitle : '—';

    for (const key of extractSymptomKeys(entry)) {
      const label = getSymptomLabel(key);
      const existing = stats.get(key) ?? { label, count: 0, phases: new Map() };
      existing.count++;
      existing.phases.set(phaseName, (existing.phases.get(phaseName) ?? 0) + 1);
      stats.set(key, existing);
    }
  }

  return [...stats.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function buildSymptomFrequencyRows(data: CycleData): string {
  const stats = buildSymptomStats(data);
  if (stats.length === 0) {
    return '<tr><td colspan="3" class="muted">Aucun symptôme enregistré</td></tr>';
  }

  return stats
    .map((s) => {
      const topPhases = [...s.phases.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([phase, n]) => `${phase} (${n}×)`)
        .join(', ');
      return `<tr>
        <td>${escapeHtml(s.label)}</td>
        <td>${s.count}</td>
        <td>${escapeHtml(topPhases || '—')}</td>
      </tr>`;
    })
    .join('');
}

function buildHeavyFlowRows(data: CycleData): string {
  const rows = Object.entries(data)
    .filter(([, e]) => e.period && (e.flow === 'fort' || e.flow === 'tres_abondant'))
    .sort(([a], [b]) => a.localeCompare(b));

  if (rows.length === 0) {
    return '<tr><td colspan="2" class="muted">Aucun jour à flux fort ou très abondant enregistré</td></tr>';
  }

  return rows
    .map(([date, entry]) => {
      const label = flowLabel(entry.flow) ?? entry.flow ?? '—';
      return `<tr>
        <td class="nowrap">${escapeHtml(formatDateShort(date))}</td>
        <td>${escapeHtml(label)}</td>
      </tr>`;
    })
    .join('');
}

function buildJournalRows(data: CycleData): string {
  const entries = Object.entries(data)
    .filter(([, e]) => e.journal?.trim())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 15);

  if (entries.length === 0) {
    return '<p class="muted">Aucune note de journal enregistrée.</p>';
  }

  return entries
    .map(([date, entry]) => {
      const ctx = getCycleContextForDate(data, date);
      const phase = ctx ? getPhaseById(ctx.phase).shortTitle : '';
      const meta = phase ? `${formatDateLong(date)} · ${phase}` : formatDateLong(date);
      return `<div class="journal-entry">
        <p class="journal-meta">${escapeHtml(meta)}</p>
        <p class="journal-text">${escapeHtml(entry.journal!.trim())}</p>
      </div>`;
    })
    .join('');
}

function buildRecentSignificantDays(data: CycleData): string {
  const dates = Object.keys(data)
    .filter((d) => {
      const e = data[d];
      if (isEmptyDayEntry(e)) return false;
      return (
        e.period ||
        (e.physical?.length ?? 0) > 0 ||
        (e.mood?.length ?? 0) > 0 ||
        (e.sleep?.length ?? 0) > 0
      );
    })
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 20);

  if (dates.length === 0) {
    return '<tr><td colspan="3" class="muted">Aucune entrée significative</td></tr>';
  }

  return dates
    .map((date) => {
      const entry = data[date];
      const ctx = getCycleContextForDate(data, date);
      const phase = ctx ? `${getPhaseById(ctx.phase).shortTitle} (J${ctx.cycleDay})` : '—';
      const lines: string[] = [];

      if (entry.period) {
        const flux = flowLabel(entry.flow);
        lines.push(flux ? `Règles — ${flux.toLowerCase()}` : 'Règles');
      }

      for (const key of extractSymptomKeys(entry)) {
        lines.push(getSymptomLabel(key));
      }

      return `<tr>
        <td class="nowrap">${escapeHtml(formatDateShort(date))}</td>
        <td>${escapeHtml(phase)}</td>
        <td>${lines.map((l) => escapeHtml(l)).join(' · ')}</td>
      </tr>`;
    })
    .join('');
}

export function buildMedicalReportHtml(data: CycleData, userEmail?: string): string {
  const generatedAt = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dates = Object.keys(data).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const loggedDays = dates.filter((d) => !isEmptyDayEntry(data[d])).length;
  const { symptomInsights } = computeSymptomCorrelations(data);

  const summaryItems = buildCycleSummaryItems(
    data,
    userEmail,
    firstDate,
    lastDate,
    loggedDays,
  );

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #2d2428;
      font-size: 10.5pt;
      line-height: 1.45;
      margin: 0;
      padding: 28px 32px;
    }
    .header {
      border-bottom: 3px solid #B85C6E;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 20pt;
      color: #B85C6E;
      margin: 0 0 4px 0;
      font-weight: 700;
    }
    .subtitle {
      color: #6b5d64;
      font-size: 9.5pt;
      margin: 0;
    }
    h2 {
      font-size: 12pt;
      color: #4A3F47;
      margin: 22px 0 8px 0;
      padding-bottom: 3px;
      border-bottom: 1px solid #E8DFD6;
    }
    .section-hint {
      font-size: 9pt;
      color: #9A8B94;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    .summary {
      background: #FBF7F2;
      border: 1px solid #E8DFD6;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .summary p { margin: 5px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 9.5pt;
    }
    th {
      background: #F3EBE3;
      color: #4A3F47;
      font-weight: 600;
      text-align: left;
      padding: 7px 9px;
      border: 1px solid #E8DFD6;
    }
    td {
      padding: 7px 9px;
      border: 1px solid #E8DFD6;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #FFFCF9; }
    .muted { color: #9A8B94; font-style: italic; }
    .nowrap { white-space: nowrap; }
    .journal-entry {
      border-left: 3px solid #C9A0DC;
      padding: 8px 12px;
      margin-bottom: 10px;
      background: #FFFCF9;
    }
    .journal-meta {
      font-size: 9pt;
      color: #9A8B94;
      margin: 0 0 4px 0;
      text-transform: capitalize;
    }
    .journal-text { margin: 0; color: #4A3F47; }
    .disclaimer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #E8DFD6;
      font-size: 8.5pt;
      color: #9A8B94;
      line-height: 1.5;
    }
    .brand { font-weight: 600; color: #B85C6E; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport de suivi menstruel</h1>
    <p class="subtitle">Document généré le ${escapeHtml(generatedAt)} · Application <span class="brand">Floraison</span></p>
  </div>

  <h2>Synthèse du cycle</h2>
  <div class="summary">
    ${summaryItems.map((item) => `<p>${item}</p>`).join('')}
  </div>

  <h2>Historique des règles</h2>
  <p class="section-hint">Dates de début et fin, durée, intensité maximale du flux et longueur du cycle jusqu'aux règles suivantes.</p>
  <table>
    <thead>
      <tr>
        <th>Début</th>
        <th>Fin</th>
        <th>Durée</th>
        <th>Flux max.</th>
        <th>Cycle suiv.</th>
      </tr>
    </thead>
    <tbody>
      ${buildPeriodHistoryRows(data)}
    </tbody>
  </table>

  <h2>Symptômes récurrents par phase</h2>
  <p class="section-hint">Tendances détectées lorsque un symptôme revient souvent dans une phase précise du cycle (≥ 65 % des jours notés, sur plusieurs cycles).</p>
  <table>
    <thead>
      <tr>
        <th>Symptôme</th>
        <th>Phase</th>
        <th>Fréquence</th>
        <th>Fiabilité</th>
      </tr>
    </thead>
    <tbody>
      ${buildInsightRows(symptomInsights)}
    </tbody>
  </table>

  <h2>Symptômes les plus fréquents</h2>
  <p class="section-hint">Vue d'ensemble de l'ensemble du suivi, toutes phases confondues.</p>
  <table>
    <thead>
      <tr>
        <th>Symptôme</th>
        <th>Occurrences</th>
        <th>Phases principales</th>
      </tr>
    </thead>
    <tbody>
      ${buildSymptomFrequencyRows(data)}
    </tbody>
  </table>

  <h2>Flux abondant</h2>
  <p class="section-hint">Jours enregistrés avec un flux fort ou très abondant (information utile pour évaluer une ménorragie).</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Intensité</th>
      </tr>
    </thead>
    <tbody>
      ${buildHeavyFlowRows(data)}
    </tbody>
  </table>

  <h2>Entrées récentes significatives</h2>
  <p class="section-hint">20 derniers jours avec règles, symptômes physiques, humeur ou sommeil — sans le détail exhaustif de chaque catégorie.</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Phase</th>
        <th>Observations</th>
      </tr>
    </thead>
    <tbody>
      ${buildRecentSignificantDays(data)}
    </tbody>
  </table>

  <h2>Notes du journal</h2>
  <p class="section-hint">Notes libres laissées par l'utilisatrice (15 plus récentes).</p>
  ${buildJournalRows(data)}

  <div class="disclaimer">
    <strong>Note pour le professionnel de santé :</strong>
    Ce document repose sur un auto-suivi déclaratif (application Floraison). Les prédictions utilisent
    une phase lutéale estimée à 14 jours et des moyennes calculées sur l'historique disponible.
    Les tendances par phase nécessitent plusieurs cycles de suivi pour être fiables.
    Ce rapport ne constitue pas un diagnostic et doit être interprété dans le contexte clinique global.
  </div>
</body>
</html>`;
}
