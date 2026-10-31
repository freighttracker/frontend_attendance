'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// OpenStreetMap tiles by default (no API key). Override with your own tile
// server via NEXT_PUBLIC_MAP_TILE_URL / NEXT_PUBLIC_MAP_TILE_ATTRIBUTION.

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || '&copy; OpenStreetMap contributors';

export const MAP_COLORS = {
  office: '#2cb825',
  officeInactive: '#a0a0a0',
  ok: '#10b981',
  warn: '#d97706',
  bad: '#ef4444',
  muted: '#555555',
  checkIn: '#2563eb',
  checkOut: '#7c3aed',
  picked: '#111111',
};

// Tooltip/popup content is built with textContent - never HTML strings -
// so employee/office names can't inject markup.

function textNode(lines) {

  const el = document.createElement('div');
  (Array.isArray(lines) ? lines : [lines]).filter(Boolean).forEach((line, i) => {
    const row = document.createElement('div');
    row.textContent = line;
    if (i === 0) row.style.fontWeight = '700';
    el.appendChild(row);
  });
  return el;

}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * circles: [{ id, latitude, longitude, radiusMeters, color, label: string|string[] }]
 * markers: [{ id, latitude, longitude, color, label, onClick }]
 * picked:  { latitude, longitude } | null  (shown as a draggable-free pin)
 * onPick:  ({ latitude, longitude }) => void  - enables click-to-pick
 */
export default function LocationMap({ circles = [], markers = [], picked = null, onPick, height = 280 }) {
  
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const groupRef = useRef(null);
  const pickRef = useRef(null);
  const onPickRef = useRef(onPick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;
    let sizeTimer = null;
    import('leaflet').then((mod) => {
      const L = mod.default || mod;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([22.5, 79], 4);
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
      groupRef.current = L.layerGroup().addTo(map);
      pickRef.current = L.layerGroup().addTo(map);
      map.on('click', (e) => onPickRef.current?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
      mapRef.current = map;
      // Maps inside an animating modal measure 0x0 on first paint.
      sizeTimer = setTimeout(() => {
        if (mapRef.current === map) map.invalidateSize({ animate: false });
      }, 250);
      setReady(true);
    });
    return () => {
      cancelled = true;
      clearTimeout(sizeTimer);
      const map = mapRef.current;
      mapRef.current = null;
      if (map) {
        // Stop any in-flight pan/zoom first; otherwise its transition-end
        // handler runs after remove() and reads _leaflet_pos off a gone pane.
        map.stop();
        map.off();
        map.remove();
      }
    };
  }, []);

  const contentKey = JSON.stringify({
    c: circles.map((c) => [c.id, c.latitude, c.longitude, c.radiusMeters, c.color, c.label]),
    m: markers.map((m) => [m.id, m.latitude, m.longitude, m.color, m.label]),
  });

  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = groupRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const points = [];

    circles.filter((c) => isNum(c.latitude) && isNum(c.longitude)).forEach((c) => {
      const color = c.color || MAP_COLORS.office;
      const circle = L.circle([c.latitude, c.longitude], { radius: c.radiusMeters || 50, color, weight: 2, fillOpacity: 0.12 });
      if (c.label) circle.bindTooltip(textNode(c.label));
      circle.addTo(group);
      L.circleMarker([c.latitude, c.longitude], { radius: 3, color, weight: 2, fillOpacity: 1 }).addTo(group);
      points.push([c.latitude, c.longitude]);
    });

    markers.filter((m) => isNum(m.latitude) && isNum(m.longitude)).forEach((m) => {
      const marker = L.circleMarker([m.latitude, m.longitude], {
        radius: 7,
        color: '#fff',
        weight: 2,
        fillColor: m.color || MAP_COLORS.checkIn,
        fillOpacity: 1,
      });
      if (m.label) marker.bindTooltip(textNode(m.label));
      if (m.onClick) marker.on('click', m.onClick);
      marker.addTo(group);
      points.push([m.latitude, m.longitude]);
    });

    if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 17, animate: false });
    else if (points.length === 1) map.setView(points[0], 16, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, contentKey]);

  useEffect(() => {
    
    if (!ready) return;
    const L = leafletRef.current;
    if (!mapRef.current || !pickRef.current) return;
    pickRef.current.clearLayers();
    if (picked && isNum(picked.latitude) && isNum(picked.longitude)) {
      L.circleMarker([picked.latitude, picked.longitude], { radius: 8, color: '#fff', weight: 2, fillColor: MAP_COLORS.picked, fillOpacity: 1 })
        .bindTooltip(textNode('Selected location'))
        .addTo(pickRef.current);
      if (!circles.length && !markers.length) mapRef.current.setView([picked.latitude, picked.longitude], Math.max(mapRef.current.getZoom(), 16), { animate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, picked?.latitude, picked?.longitude]);

  return <div ref={containerRef} className={`lmap ${onPick ? 'pick' : ''}`} style={{ height }} />;
}
