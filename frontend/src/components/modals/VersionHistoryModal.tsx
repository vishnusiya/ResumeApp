import React from 'react';
import { X, History, RotateCcw, Clock, Plus } from 'lucide-react';
import type { VersionSnapshot } from '../../types/resume';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: VersionSnapshot[];
  onRestoreSnapshot: (snapshot: VersionSnapshot) => void;
  onCreateSnapshot: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRestoreSnapshot,
  onCreateSnapshot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <History className="w-5 h-5 text-blue-600" />
            <span>Version History & Snapshots</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {snapshots.length} saved snapshot{snapshots.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={onCreateSnapshot}
            className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Snapshot Now</span>
          </button>
        </div>

        {/* Snapshot Timeline List */}
        <div className="p-6 overflow-y-auto space-y-3 text-xs text-slate-700">
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No version history saved yet.
            </div>
          ) : (
            snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                className="p-3.5 border border-slate-200 hover:border-blue-400 rounded-xl bg-white hover:bg-blue-50/30 transition-all flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{snap.label}</span>
                      {idx === 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {snap.timestamp} · {snap.wordCount} words · {snap.pageCount} pages
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRestoreSnapshot(snap);
                    onClose();
                  }}
                  className="py-1.5 px-3 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
