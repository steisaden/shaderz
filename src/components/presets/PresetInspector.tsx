import React, { useState } from 'react';
import { getAllPresets } from './PresetRegistry';

export default function PresetInspector() {
  const [isOpen, setIsOpen] = useState(false);
  const presets = getAllPresets();

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-slate-900/80 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 p-2 rounded-lg text-xs backdrop-blur-md shadow-2xl transition-all z-[9999] flex items-center gap-2"
      >
        <span>📊</span> Inspector
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-slate-950/90 border border-slate-800 rounded-xl shadow-2xl z-[9999] backdrop-blur-lg text-slate-200 p-4 max-h-[70vh] overflow-y-auto custom-scrollbar flex flex-col gap-3">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
          <span>📊</span> Component Dashboard
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-slate-300 text-lg leading-none p-1"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {presets.map(p => (
          <div key={p.id} className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-2 text-xs flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-300">{p.name}</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                v{p.version}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 italic">{p.description}</p>
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-850 text-[10px]">
              <span className="text-slate-400 flex items-center gap-1">
                Status: <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span> Operational
              </span>
              <span className="text-slate-500 font-mono">ID: {p.id}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[9px] text-slate-600 text-center pt-2 border-t border-slate-850">
        Operational parameters tracking active WebGL context hooks.
      </div>
    </div>
  );
}
