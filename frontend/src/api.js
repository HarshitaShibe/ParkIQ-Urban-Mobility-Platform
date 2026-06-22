const BASE = "http://localhost:8000";

export const api = {
  overview:        () => fetch(`${BASE}/stats/overview`).then(r => r.json()),
  hotspots:        (limit=20) => fetch(`${BASE}/hotspots/ranked?limit=${limit}`).then(r => r.json()),
  hotspotsBySev:   (sev) => fetch(`${BASE}/hotspots/severity/${sev}`).then(r => r.json()),
  hotspotSummary:  () => fetch(`${BASE}/hotspots/summary`).then(r => r.json()),
  heatmapPoints:   () => fetch(`${BASE}/heatmap/points`).then(r => r.json()),
  heatmapGeoJSON:  () => fetch(`${BASE}/heatmap`).then(r => r.json()),
  trendsDaily:     () => fetch(`${BASE}/trends/daily`).then(r => r.json()),
  trendsWeekly:    () => fetch(`${BASE}/trends/weekly`).then(r => r.json()),
  trendsLocation:  (loc) => fetch(`${BASE}/trends/location?location=${encodeURIComponent(loc)}`).then(r => r.json()),
  topDays:         () => fetch(`${BASE}/trends/top-days`).then(r => r.json()),
  anomalies:       (sev, limit=50) => fetch(`${BASE}/anomalies?${sev ? `severity=${sev}&` : ''}limit=${limit}`).then(r => r.json()),
  anomalySummary:  () => fetch(`${BASE}/anomalies/summary`).then(r => r.json()),
  recentAnomalies: (days=7) => fetch(`${BASE}/anomalies/recent?days=${days}`).then(r => r.json()),
  enforcement:     (n=10) => fetch(`${BASE}/enforcement/deploy?top_n=${n}`).then(r => r.json()),
  liveReports:     (limit=20) => fetch(`${BASE}/report/live?limit=${limit}`).then(r => r.json()),
  liveGeoJSON:     () => fetch(`${BASE}/report/live/geojson`).then(r => r.json()),
  uploadVideo:     (formData) => fetch(`${BASE}/report/video`, { method: 'POST', body: formData }).then(r => r.json()),
  updateStatus:    (id, status) => fetch(`${BASE}/report/live/${id}/status?status=${status}`, { method: 'PATCH' }).then(r => r.json()),
};
