import React, { useState } from 'react';
import { useOwner } from '../context/OwnerContext';
import { ShieldCheck, Lock, X, CheckCircle2 } from 'lucide-react';
import { PrismLogo } from './PrismLogo';

export const OwnerAuthModal: React.FC = () => {
  const { isOwner, isOwnerModalOpen, closeOwnerModal, unlockOwner, lockToViewer } = useOwner();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOwnerModalOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = unlockOwner(passcode);
    if (ok) {
      setError(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        closeOwnerModal();
      }, 700);
    } else {
      setError(true);
    }
  };

  const handleQuickUnlock = () => {
    unlockOwner('axiom2026');
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      closeOwnerModal();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={closeOwnerModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <PrismLogo className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Axiom Laboratory Access Control
            </h3>
            <p className="text-xs text-slate-500">
              Role-Based Configuration & Ownership
            </p>
          </div>
        </div>

        <div className="p-3.5 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Access Tier:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              Private Workspace Owner
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Current Role:</span>
            {isOwner ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Owner (Full Edit Access)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                <Lock className="w-3.5 h-3.5" />
                Viewer (Interactive Use Only)
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {isOwner ? (
            <p>
              You are authenticated with <strong>Owner Privileges</strong>. You can modify dataset CSVs, retrain regression algorithms, and alter model hyperparameters.
            </p>
          ) : (
            <p>
              Visitors are restricted to <strong>Viewer Mode</strong>: you can run live strength predictions, optimize mixes, converse with the AI Assistant, and download PDF reports, but cannot overwrite training datasets or retrain base models.
            </p>
          )}
        </div>

        {isOwner ? (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                lockToViewer();
                closeOwnerModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Switch to Viewer Mode (Test Read-Only)</span>
            </button>
            <button
              onClick={closeOwnerModal}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Keep Owner Mode Active
            </button>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Owner Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter passcode or click Quick Unlock"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              {error && (
                <p className="text-[11px] text-rose-500 mt-1">
                  Incorrect passcode. Click Quick Unlock below.
                </p>
              )}
              {success && (
                <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Owner access verified successfully!
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Authenticate
              </button>
              <button
                type="button"
                onClick={handleQuickUnlock}
                className="flex-1 py-2 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Quick Unlock (Owner)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
