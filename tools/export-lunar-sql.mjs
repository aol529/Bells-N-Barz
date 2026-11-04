// Writes the lunar_calendar seed for sql/95-scheduled-reminders.sql, using the website's
// own moon maths lifted out of js/bells-n-barz-shell.js, so server reminders fall at
// exactly the times the site and the app show. Usage: node tools/export-lunar-sql.mjs 2026-11-01 2030-01-01
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../js/bells-n-barz-shell.js', import.meta.url), 'utf8');
const from = src.indexOf('function toJulianDate(date)');
const to = src.indexOf('function fmtCountdown(ms)');
const { nextEkadashi, tithiAt, findTithiTransition } =
  new Function(src.slice(from, to) + '; return { nextEkadashi, tithiAt, findTithiTransition };')();

const endOf = (tithi, d) => {
  const start = tithiAt(d) === tithi ? d : findTithiTransition(d, t => t === tithi, false);
  return start ? findTithiTransition(start, t => t === tithi, true) : null;
};
const start = new Date(process.argv[2] + 'T00:00:00Z'), end = new Date(process.argv[3] + 'T00:00:00Z');
const seen = new Map();
const add = (kind, when, paksha) => {
  if (!when || when >= end) return;
  const t = new Date(Math.floor(when.getTime() / 60000) * 60000).toISOString();
  seen.set(kind + t, `('${kind}','${t}',${paksha ? `'${paksha}'` : 'null'})`);
};
for (let d = start; d < end; d = new Date(d.getTime() + 6 * 3600 * 1000)) {
  const ek = nextEkadashi(d);
  if (!ek.ongoing) add('ekadashi', ek.start, ek.paksha);
  add('new_moon', endOf(30, d));
  add('full_moon', endOf(15, d));
}
console.log([...seen.values()].sort((a, b) => a.slice(a.indexOf("'20")).localeCompare(b.slice(b.indexOf("'20")))).join(',\n'));
