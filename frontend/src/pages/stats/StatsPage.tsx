import { useState } from 'react';
import { parseISO, startOfDay } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import { useStats } from '../../features/tasks/hooks';
import { formatDayLabel } from '../../lib/date';

const StatsPage = () => {
  const [startDate, setStartDate] = useState(() => startOfDay(parseISO('2025-11-30')));
  const [endDate, setEndDate] = useState(() => startOfDay(new Date()));

  const statsQuery = useStats(startDate, endDate);

  const totals = statsQuery.data?.aggregates;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-brand-800/30 bg-gradient-to-br from-brand-900/40 via-slate-900 to-black p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-white/60">Range</p>
            <h2 className="text-2xl font-semibold">Insight window</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="rounded-2xl border border-brand-800/30 bg-brand-900/20 px-4 py-2 text-white/80">
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">Start</span>
              <input
                type="date"
                value={startDate.toISOString().slice(0, 10)}
                max={endDate.toISOString().slice(0, 10)}
                onChange={(event) => setStartDate(new Date(event.target.value))}
                className="block bg-transparent text-sm text-white focus:outline-none"
              />
            </label>
            <label className="rounded-2xl border border-brand-800/30 bg-brand-900/20 px-4 py-2 text-white/80">
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">End</span>
              <input
                type="date"
                value={endDate.toISOString().slice(0, 10)}
                min={startDate.toISOString().slice(0, 10)}
                onChange={(event) => setEndDate(new Date(event.target.value))}
                className="block bg-transparent text-sm text-white focus:outline-none"
              />
            </label>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Completed', value: totals?.completed ?? 0, tone: 'text-brand-400' },
            { label: 'Skipped', value: totals?.skipped ?? 0, tone: 'text-rose-300' },
            { label: 'Not started', value: totals?.notStarted ?? 0, tone: 'text-white' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">{metric.label}</p>
              <p className={`mt-2 text-3xl font-semibold ${metric.tone}`}>{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Daily rhythm</p>
            <h3 className="text-xl font-semibold">Breakdown</h3>
          </div>
          <BarChart3 className="h-6 w-6 text-white/50" />
        </div>
        <div className="mt-6 space-y-4">
          {statsQuery.isLoading && (
            <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-6 text-center">
              <div className="inline-flex items-center gap-2 text-brand-300">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading statistics…</span>
              </div>
            </div>
          )}
          {statsQuery.data?.dailyBreakdown.map((day) => {
            // Calculate percentages, ensuring they don't exceed 100% and add up correctly
            const total = day.totals.total || 0;
            const percentages = {
              completed: total > 0 ? Math.min(100, (day.totals.completed / total) * 100) : 0,
              skipped: total > 0 ? Math.min(100, (day.totals.skipped / total) * 100) : 0,
              notStarted: total > 0 ? Math.min(100, (day.totals.notStarted / total) * 100) : 0,
            };
            
            // Ensure percentages don't exceed 100% total (rounding safety)
            const totalPercentage = percentages.completed + percentages.skipped + percentages.notStarted;
            if (totalPercentage > 100) {
              const scale = 100 / totalPercentage;
              percentages.completed *= scale;
              percentages.skipped *= scale;
              percentages.notStarted *= scale;
            }

            return (
              <div key={day.date} className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{formatDayLabel(day.date)}</span>
                  <span className="text-white/60">{day.totals.total} rituals</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="flex h-full overflow-hidden rounded-full">
                    <span style={{ width: `${percentages.completed}%` }} className="bg-brand-500" />
                    <span style={{ width: `${percentages.skipped}%` }} className="bg-rose-400" />
                    <span style={{ width: `${percentages.notStarted}%` }} className="bg-white/30" />
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-brand-500" />
                    {day.totals.completed} done
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    {day.totals.skipped} skipped
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-white/40" />
                    {day.totals.notStarted} pending
                  </span>
                </div>
              </div>
            );
          })}
          {!statsQuery.isLoading && (statsQuery.data?.dailyBreakdown.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-brand-800/30 bg-brand-900/10 p-6 text-center text-white/60">
              <p>No stats for this range.</p>
              <p className="mt-2 text-sm text-brand-300">Expand the window above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;

