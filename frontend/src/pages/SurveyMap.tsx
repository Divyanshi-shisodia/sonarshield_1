import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  GeoJSON,
} from "react-leaflet";
import { getAnomalies } from "../services/api";
import RiskBadge from "../components/RiskBadge";

const RISK_COLOR: Record<string, string> = {
  HIGH: "#f87171",
  MEDIUM: "#facc15",
  LOW: "#4ade80",
};

const BASE_CENTER: [number, number] = [15.2993, 74.1240];

export default function SurveyMap() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [indiaGeoJSON, setIndiaGeoJSON] = useState<any>(null);

  useEffect(() => {
    // Load anomaly data
    getAnomalies()
      .then(setAnomalies)
      .catch(() => {});

    // Load India boundary GeoJSON
    fetch("/india-soi.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load India boundary");
        }
        return res.json();
      })
      .then(setIndiaGeoJSON)
      .catch(() => {});
  }, []);

  const points: [number, number][] = anomalies.length
    ? anomalies.map((a) => [a.lat, a.lng])
    : [];

  const surveyPath: [number, number][] = [
    [15.31, 74.10],
    [15.305, 74.115],
    [15.30, 74.125],
    [15.295, 74.135],
    [15.29, 74.145],
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Survey Map</h1>
          <p className="text-slate-400 text-sm">
            Simulated underwater survey area &amp; anomaly locations
          </p>
        </div>

        <span className="badge badge-demo">
          SIMULATED SURVEY DATA
        </span>
      </div>

      {/* Map */}
      <div
        className="glass rounded-xl overflow-hidden"
        style={{ height: 520 }}
      >
        <MapContainer
          center={BASE_CENTER}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          {/* OpenStreetMap Base Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* India Boundary */}
          {indiaGeoJSON && (
            <GeoJSON
              data={indiaGeoJSON}
              style={{
                color: "#ef4444",
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0,
              }}
            />
          )}

          {/* Existing Survey Path */}
          <Polyline
            positions={surveyPath}
            pathOptions={{
              color: "#22e5e0",
              dashArray: "6 6",
              weight: 2,
            }}
          />

          {/* Anomaly Markers */}
          {points.map((p, i) => {
            const a = anomalies[i];

            return (
              <CircleMarker
                key={a.id}
                center={p}
                radius={9}
                pathOptions={{
                  color: RISK_COLOR[a.risk],
                  fillColor: RISK_COLOR[a.risk],
                  fillOpacity: 0.7,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold mb-1">
                      {a.id}
                    </div>

                    <div>Location: {a.location}</div>
                    <div>Risk: {a.risk}</div>
                    <div>Score: {a.score}/100</div>
                    <div>Status: {a.status}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-4">
        {["HIGH", "MEDIUM", "LOW"].map((r) => (
          <div
            key={r}
            className="glass rounded-xl p-4 flex items-center gap-3"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: RISK_COLOR[r] }}
            />

            <div>
              <div className="text-xs text-slate-400 mono">
                {r} RISK
              </div>

              <div className="text-lg font-bold">
                {anomalies.filter((a) => a.risk === r).length}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detected Anomalies */}
      <div className="glass rounded-xl p-4">
        <div className="text-sm font-semibold mb-3">
          Detected Anomalies
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10 mono text-xs">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Risk</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {anomalies.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="py-2 pr-4 mono text-cyan-glow">
                    {a.id}
                  </td>

                  <td className="py-2 pr-4">
                    {a.location}
                  </td>

                  <td className="py-2 pr-4">
                    <RiskBadge risk={a.risk} />
                  </td>

                  <td className="py-2 pr-4 mono">
                    {a.score}
                  </td>

                  <td className="py-2 pr-4 text-slate-300">
                    {a.status}
                  </td>
                </tr>
              ))}

              {anomalies.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-slate-500"
                  >
                    No anomalies yet — run an analysis first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}