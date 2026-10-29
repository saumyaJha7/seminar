'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AgentWorkingScreen } from '@/components/AgentWorkingScreen';
import { useAssessment } from '@/context/AssessmentContext';

export default function ProcessingPage() {
  const router = useRouter();
  const {
    studentName,
    agentStatuses,
    agentExecutionTimes,
    agentActivities,
    logs,
    isEvaluating,
    report,
    assessmentId,
    assessmentMode,
    assessmentStatus,
    requestError,
    progressEvents,
    retryAssessment,
    refreshAssessmentStatus,
    setInspectingAgentId,
  } = useAssessment();

  return (
    <div className="space-y-6">
      <AgentWorkingScreen
        studentName={studentName}
        agentStatuses={agentStatuses}
        agentExecutionTimes={agentExecutionTimes}
        agentActivities={agentActivities}
        logs={logs}
        isEvaluating={isEvaluating}
        report={report}
        assessmentId={assessmentId}
        assessmentMode={assessmentMode}
        assessmentStatus={assessmentStatus}
        requestError={requestError}
        progressEvents={progressEvents}
        onInspectAgent={(id) => setInspectingAgentId(id)}
        onViewReport={() => router.push('/report')}
        onBackToSetup={() => router.push('/')}
        onRetry={retryAssessment}
        onRefreshStatus={refreshAssessmentStatus}
      />
    </div>
  );
}
