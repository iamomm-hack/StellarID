'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface HistoryPoint {
  score: number;
  date: string;
  timestamp: number;
}

interface ReputationHistoryProps {
  history: HistoryPoint[];
}

export default function ReputationHistory({ history }: ReputationHistoryProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md h-80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-mono text-muted">Initialising Chart Engine...</span>
        </div>
      </div>
    );
  }

  // Custom tool tip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="border border-white/[0.08] bg-black/80 backdrop-blur-md p-3 rounded-xl shadow-xl font-mono text-[10px] flex flex-col gap-1">
          <p className="text-muted">{payload[0].payload.date}</p>
          <p className="font-bold text-foreground">
            Reputation: <span className="text-indigo-400">{payload[0].value} pts</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-mono tracking-[0.2em] text-muted uppercase flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Score Trajectory
        </h3>
        <span className="text-[9px] font-mono text-muted flex items-center gap-1 bg-white/[0.03] border border-white/[0.04] px-2 py-0.5 rounded-full">
          <Activity className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
          Realtime Index
        </span>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 1000]}
              ticks={[0, 200, 500, 1000]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
            
            {/* Tier Boundary Lines */}
            <ReferenceLine
              y={200}
              stroke="rgba(59, 130, 246, 0.15)"
              strokeDasharray="4 4"
              label={{
                value: 'Proven Tier',
                fill: 'rgba(59, 130, 246, 0.4)',
                fontSize: 8,
                position: 'right',
                offset: 5,
                fontFamily: 'monospace'
              }}
            />
            <ReferenceLine
              y={500}
              stroke="rgba(168, 85, 247, 0.15)"
              strokeDasharray="4 4"
              label={{
                value: 'Elite Builder Tier',
                fill: 'rgba(168, 85, 247, 0.4)',
                fontSize: 8,
                position: 'right',
                offset: 5,
                fontFamily: 'monospace'
              }}
            />

            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#scoreGlow)"
              strokeWidth={0}
              fill="url(#scoreGlow)"
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ stroke: '#6366f1', strokeWidth: 1, r: 3, fill: '#0f172a' }}
              activeDot={{ r: 5, strokeWidth: 1, stroke: '#ffffff', fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
