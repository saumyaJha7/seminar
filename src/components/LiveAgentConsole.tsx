'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2, Filter, Sparkles, Brain, Search, Award } from 'lucide-react';
import { AgentId, AgentLogEntry } from '@/types/assessment';

interface LiveAgentConsoleProps {
  logs: AgentLogEntry[];
  onClearLogs: () => void;
  isRunning?: boolean;
}

export const LiveAgentConsole: React.FC<LiveAgentConsoleProps> = ({
  logs,
  onClearLogs,
  isRunning = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<AgentId | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (selectedAgentFilter === 'all') return true;
    return log.agentId === selectedAgentFilter;
  });

  const getLevelBadge = (level: AgentLogEntry['level']) => {
    switch (level) {
      case 'thought':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
            THOUGHT
          </span>
        );
      case 'action':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            ACTION
          </span>
        );
      case 'success':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            SUCCESS
          </span>
        );
      case 'warn':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            WARN
          </span>
        );
      case 'error':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            ERROR
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            INFO
          </span>
        );
    }
  };

  const getAgentColor = (agentId: AgentId) => {
    switch (agentId) {
      case 'orchestrator':
        return 'text-violet-400';
      case 'designer':
        return 'text-cyan-400';
      case 'analyzer':
        return 'text-indigo-400';
      case 'coach':
        return 'text-emerald-400';
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Agent Live Execution Console</span>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Stream Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter options */}
          <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setSelectedAgentFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                selectedAgentFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedAgentFilter('orchestrator')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                selectedAgentFilter === 'orchestrator'
                  ? 'bg-violet-900/40 text-violet-300 border border-violet-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orchestrator
            </button>
            <button
              onClick={() => setSelectedAgentFilter('designer')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                selectedAgentFilter === 'designer'
                  ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Designer
            </button>
            <button
              onClick={() => setSelectedAgentFilter('analyzer')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                selectedAgentFilter === 'analyzer'
                  ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Analyzer
            </button>
            <button
              onClick={() => setSelectedAgentFilter('coach')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                selectedAgentFilter === 'coach'
                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Coach
            </button>
          </div>

          <button
            onClick={onClearLogs}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Clear Console Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      {isExpanded && (
        <div className="p-4 max-h-64 overflow-y-auto space-y-2.5 bg-slate-950/95 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="py-6 text-center text-slate-500 font-sans">
              <p>No execution logs yet. Launch an assessment above to observe real-time agent coordination.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/40 p-1 rounded transition">
                <span className="text-slate-500 text-[10px] whitespace-nowrap pt-0.5">{log.timestamp}</span>
                <span className="pt-0.5">{getLevelBadge(log.level)}</span>
                <span className={`font-semibold whitespace-nowrap text-[11px] ${getAgentColor(log.agentId)}`}>
                  [{log.agentName}]:
                </span>
                <div className="flex-1 text-slate-300 font-sans text-xs leading-relaxed">
                  {log.message}
                  {log.details && (
                    <pre className="mt-1 font-mono text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded border border-slate-800 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
