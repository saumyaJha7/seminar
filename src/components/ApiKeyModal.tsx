'use client';

import React from 'react';
import { AlertCircle, ExternalLink, Key, Shield, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasEnvKey: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, hasEnvKey }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Groq API Configuration</h3>
              <p className="text-xs text-slate-500">Server-side inference credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Groq configuration"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {hasEnvKey ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Groq is configured on the server.</strong> The secret is not sent to or stored in your browser.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <span>
                No server-side <code className="bg-orange-100 px-1 py-0.5 rounded font-mono">GROQ_API_KEY</code> is configured. The app will use clearly labeled Demo Mode.
              </span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-slate-900">To enable live inference</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Add <code className="font-mono">GROQ_API_KEY</code> to the project root <code className="font-mono">.env</code>.</li>
              <li>Restart the development server.</li>
            </ol>
            <p className="text-slate-500">Never paste API keys into the browser or commit them to source control.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <span>Create a key at:</span>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 hover:text-blue-800 flex items-center gap-1 font-bold underline"
            >
              console.groq.com <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
