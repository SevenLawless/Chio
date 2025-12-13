import { useState, useMemo } from 'react';
import { parseISO, startOfDay } from 'date-fns';
import { Flame, Trophy, Target, Sparkles, TrendingUp, Calendar, Zap, Star } from 'lucide-react';
import { useStats } from '../../features/tasks/hooks';
import { formatDayLabel } from '../../lib/date';
import type { DayStatus } from '../../types/task';
import { Badge } from '../../components/ui/Badge';

// Motivational messages based on performance
const getMotivationalMessage = (currentStreak: number, status: DayStatus | null, percentage: number): string => {
  if (status === 'FLAWLESS') {
    const messages = [
      "Absolutely legendary! You're on fire!",
      "Perfect execution! Nothing can stop you!",
      "Flawless victory! Keep dominating!",
      "You're a machine! Incredible work!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (status === 'GOOD') {
    const messages = [
      "Great momentum! You're crushing it!",
      "Solid progress! Keep pushing forward!",
      "You're on the right track!",
      "Excellent work! Stay focused!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (currentStreak > 0) {
    if (currentStreak >= 7) {
      return `${currentStreak} day streak! You're unstoppable!`;
    }
    if (currentStreak >= 3) {
      return `${currentStreak} days strong! Keep the fire burning!`;
    }
    return "Building momentum! Every day counts!";
  }

  if (percentage > 0) {
    return "Progress is progress! Keep going!";
  }

  return "Ready to start your journey? Let's go!";
};

const DayStatusBadge = ({ status }: { status: DayStatus }) => {
  if (status === 'FLAWLESS') {
    return (
      <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
        <Trophy className="h-3 w-3" />
        FLAWLESS
      </Badge>
    );
  }
  if (status === 'GOOD') {
    return (
      <Badge className="bg-gradient-to-r from-brand-500/20 to-emerald-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1">
        <Flame className="h-3 w-3" />
        GOOD
      </Badge>
    );
  }
  return null;
};

const StatsPage = () => {
  const [startDate, setStartDate] = useState(() => startOfDay(parseISO('2025-11-30')));
  const [endDate, setEndDate] = useState(() => startOfDay(new Date()));

  const statsQuery = useStats(startDate, endDate);

  const data = statsQuery.data;
  const totals = data?.aggregates;
  const streaks = data?.streaks ?? { current: 0, best: 0 };
  const dayStats = data?.dayStats ?? { good: 0, flawless: 0, total: 0 };

  // Get today's status for motivational message
  const todayStatus = useMemo(() => {
    if (!data?.dailyBreakdown.length) return null;
    const today = data.dailyBreakdown[data.dailyBreakdown.length - 1];
    return today?.status ?? null;
  }, [data?.dailyBreakdown]);

  const overallPercentage = totals && totals.total > 0 
    ? Math.round((totals.completed / totals.total) * 100) 
    : 0;

  const motivationalMessage = getMotivationalMessage(streaks.current, todayStatus, overallPercentage);

  return (
    <div className="space-y-6">
      {/* Hero Section with Streak */}
      <div className="rounded-3xl border border-brand-800/30 bg-gradient-to-br from-brand-900/40 via-slate-900 to-black p-6 text-white overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Streak display */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-500/30">
                {streaks.current > 0 ? (
                  <>
                    <Flame className="h-8 w-8 text-brand-400 animate-pulse" />
                    <span className="text-3xl font-bold text-brand-300">{streaks.current}</span>
                  </>
                ) : (
                  <>
                    <Target className="h-8 w-8 text-white/40" />
                    <span className="text-lg font-medium text-white/40">Start</span>
                  </>
                )}
              </div>
              <div>
                <p className="text-sm text-white/60">Current streak</p>
                <h2 className="text-2xl font-bold">
                  {streaks.current > 0 
                    ? `${streaks.current} day${streaks.current !== 1 ? 's' : ''} strong!`
                    : 'Ready to begin'}
                </h2>
                <p className="mt-1 text-sm text-brand-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {motivationalMessage}
                </p>
              </div>
            </div>

            {/* Date range picker */}
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
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Best Streak */}
        <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Best streak</p>
              <p className="text-2xl font-bold">{streaks.best} <span className="text-sm font-normal text-white/60">days</span></p>
            </div>
          </div>
        </div>

        {/* Flawless Days */}
        <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Flawless days</p>
              <p className="text-2xl font-bold">{dayStats.flawless}</p>
            </div>
          </div>
        </div>

        {/* Good Days */}
        <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20">
              <Flame className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Good days</p>
              <p className="text-2xl font-bold">{dayStats.good}</p>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Completion</p>
              <p className="text-2xl font-bold">{overallPercentage}<span className="text-sm font-normal text-white/60">%</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-5 w-5 text-brand-400" />
          <h3 className="text-lg font-semibold">Mission Summary</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-brand-400">{totals?.completed ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Skipped</p>
            <p className="mt-2 text-3xl font-semibold text-rose-300">{totals?.skipped ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Not started</p>
            <p className="mt-2 text-3xl font-semibold text-white">{totals?.notStarted ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="rounded-3xl border border-brand-800/30 bg-brand-900/20 p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-brand-400" />
            <div>
              <h3 className="text-lg font-semibold">Daily Journey</h3>
              <p className="text-sm text-white/60">Your progress day by day</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Skipped
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white/30" />
              Pending
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {statsQuery.isLoading && (
            <div className="rounded-2xl border border-brand-800/30 bg-brand-900/20 p-6 text-center">
              <div className="inline-flex items-center gap-2 text-brand-300">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading insights…</span>
              </div>
            </div>
          )}

          {data?.dailyBreakdown.map((day) => {
            const total = day.totals.total || 0;
            const percentages = {
              completed: total > 0 ? Math.min(100, (day.totals.completed / total) * 100) : 0,
              skipped: total > 0 ? Math.min(100, (day.totals.skipped / total) * 100) : 0,
              notStarted: total > 0 ? Math.min(100, (day.totals.notStarted / total) * 100) : 0,
            };
            
            const totalPercentage = percentages.completed + percentages.skipped + percentages.notStarted;
            if (totalPercentage > 100) {
              const scale = 100 / totalPercentage;
              percentages.completed *= scale;
              percentages.skipped *= scale;
              percentages.notStarted *= scale;
            }

            return (
              <div key={day.date} className="rounded-2xl border border-brand-800/30 bg-brand-900/10 p-4 transition hover:bg-brand-900/20">
                <div className="flex items-center justify-between gap-4 text-sm mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatDayLabel(day.date)}</span>
                    <DayStatusBadge status={day.status} />
                  </div>
                  <span className="text-white/60">{day.totals.total} missions</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="flex h-full">
                    <span 
                      style={{ width: `${percentages.completed}%` }} 
                      className={`transition-all ${
                        day.status === 'FLAWLESS' 
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-300' 
                          : 'bg-brand-500'
                      }`} 
                    />
                    <span style={{ width: `${percentages.skipped}%` }} className="bg-rose-400" />
                    <span style={{ width: `${percentages.notStarted}%` }} className="bg-white/30" />
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-white/60">
                  <span>{day.totals.completed} done</span>
                  <span>{day.totals.skipped} skipped</span>
                  <span>{day.totals.notStarted} pending</span>
                </div>
              </div>
            );
          })}

          {!statsQuery.isLoading && (data?.dailyBreakdown.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-brand-800/30 bg-brand-900/10 p-6 text-center text-white/60">
              <p>No data for this range.</p>
              <p className="mt-2 text-sm text-brand-300">Adjust the date range above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
