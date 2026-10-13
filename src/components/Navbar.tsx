import React from 'react';
import { Sun, Moon, FileDown, ShieldCheck, Lock } from 'lucide-react';
import { PrismLogo } from './PrismLogo';
import { useOwner } from '../context/OwnerContext';

export type TabKey = 'overview' | 'eda' | 'model' | 'predictor' | 'mix' | 'assistant' | 'viva';

interface NavbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onExportReport: () => void;
  onDownloadApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onExportReport,
  onDownloadApp,
}) => {
  const { isOwner, openOwnerModal } = useOwner();

  const navItems: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'eda', label: 'Dataset & EDA' },
    { key: 'model', label: 'Model Lab' },
    { key: 'predictor', label: 'Strength Predictor' },
    { key: 'mix', label: 'Mix Calculator' },
    { key: 'assistant', label: 'AI Assistant' },
    { key: 'viva', label: 'Viva & Report' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark with Prism Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-center">
            <PrismLogo className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg whitespace-nowrap">
                Axiom
              </span>
              <button
                type="button"
                onClick={openOwnerModal}
                title={isOwner ? 'Authenticated as Owner (Full Edit Access)' : 'Viewer Mode (Read-Only). Click to authenticate as Owner'}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border transition-colors ${
                  isOwner
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                {isOwner ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Owner</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    <span>Viewer</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap hidden sm:block">
              DATA ANALYTICS LAB, SASTRA DEEMED UNIVERSITY, Developed by Surya.S (III-YEAR B.Tech CIVIL ENGINEERING)
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
