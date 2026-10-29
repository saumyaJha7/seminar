'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from './Navbar';
import { StepProgressBar, AppScreen } from './StepProgressBar';
import { AgentInspectorModal } from './AgentInspectorModal';
import { ApiKeyModal } from './ApiKeyModal';
import { ArchitectureModal } from './ArchitectureModal';
import { useAssessment } from '@/context/AssessmentContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    hasServerGroqKey,
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
    isArchitectureModalOpen,
    setIsArchitectureModalOpen,
    inspectingAgentId,
    setInspectingAgentId,
    agentPayloads,
    report,
    isEvaluating,
  } = useAssessment();

  const isGroqConnected = hasServerGroqKey;

  const getCurrentScreen = (): AppScreen => {
    if (pathname === '/processing') return 'working';
    if (pathname === '/report') return 'report';
    return 'setup';
  };

  const handleNavigate = (screen: AppScreen) => {
    if (screen === 'setup') router.push('/');
    if (screen === 'working') router.push('/processing');
    if (screen === 'report') router.push('/report');
  };

  return (
    <div className="app-shell min-h-screen flex flex-col relative overflow-hidden text-slate-900">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 ambient-light-glow pointer-events-none z-0" />
      <div className="fixed inset-0 bg-light-pattern opacity-50 pointer-events-none z-0" />

      {/* Top Navbar */}
      <Navbar
        hasGroqKey={isGroqConnected}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Multipage Stepper Bar */}
        <StepProgressBar
          currentScreen={getCurrentScreen()}
          onNavigate={handleNavigate}
          hasReport={Boolean(report)}
          isProcessing={isEvaluating}
        />

        {/* Animated Page Content */}
        <div key={pathname} className="animate-page-enter">
          {children}
        </div>
      </main>

      {/* Modals */}
      <AgentInspectorModal
        agentId={inspectingAgentId}
        onClose={() => setInspectingAgentId(null)}
        agentData={inspectingAgentId ? agentPayloads[inspectingAgentId] : undefined}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        hasEnvKey={hasServerGroqKey}
      />

      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      <footer className="app-footer border-t border-indigo-100 py-5 text-center text-xs text-slate-600 relative z-10 backdrop-blur-md">
        <p>Student Cognitive Assessment System • Coordinated Multi-Agent Reasoning Architecture</p>
      </footer>
    </div>
  );
};
