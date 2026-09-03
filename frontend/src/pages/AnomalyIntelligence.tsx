import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useMission } from "../hooks/MissionContext";
import { analyzeImage } from "../services/api";
import RiskBadge from "../components/RiskBadge";

export default function AnomalyIntelligence() {
  const m = useMission();
  const [busy, setBusy] = useState(false);

  async function runAnalyze() {
    if (!m.imageId) return;
    setBusy(true);
    try {
      const res = await analyzeImage(m.imageId, m.missionId);
      m.setAnomalies(res.anomalies);
    } finally {
      setBusy(false);
    }
  }

  if (!m.imageId || m.objects.length === 0) {
    return (
      <div className="glass rounded-xl p-10 text-center text-slate-400">
        <AlertCircle className="mx-auto mb-3 text-cyan-glow" size={32} />
        No objects available. Run analysis on <b className="text-cyan-glow">Sonar Analysis</b> first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Anomaly Intelligence</h1>
          <p className="text-slate-400 text-sm">Explainable, transparent risk scoring</p>
        </div>
        <button
          onClick={runAnalyze}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-cyan-glow text-abyss-950 font-bold hover:shadow-glow disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          Compute Anomaly Scores
        </button>
      </div>

      {m.anomalies.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-slate-400">
          Click <b className="text-cyan-glow">Compute Anomaly Scores</b> to generate the prototype risk assessment.
        </div>
      ) : (
        <div className="space-y-5">
          {m.anomalies.map((a) => (
            <div key={a.anomaly_id} className="glass rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs mono text-slate-400">{a.anomaly_id} · {a.location} · {a.class_name}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-3xl font-extrabold text-cyan-glow">{a.anomaly_score}<span className="text-sm text-slate-400">/100</span></div>
                    <RiskBadge risk={a.risk} />
                  </div>
                </div>
                <span className="badge badge-demo">{a.label}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Risk Score Breakdown</div>
                  <BreakdownBar label="Detection Confidence (40%)" value={a.breakdown.confidence_component} max={40} />
                  <BreakdownBar label="Object Area (20%)" value={a.breakdown.area_component} max={20} />
                  <BreakdownBar label="Shadow Evidence (20%)" value={a.breakdown.shadow_component} max={20} />
                  <BreakdownBar label="Boundary/Shape Evidence (20%)" value={a.breakdown.boundary_component} max={20} />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Why Was This Flagged?</div>
                  <div className="space-y-1.5">
                    {a.reasoning.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-[11px] text-slate-500 mono">
                Prototype Risk Assessment — hand-authored heuristic formula, not a scientifically validated maritime risk model.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BreakdownBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="mono text-cyan-glow">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-abyss-700 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-glow/60 to-cyan-glow rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
