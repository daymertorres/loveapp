// js/map.js
// Mapa interactivo con Leaflet + Firebase Realtime Database

import { rtdb } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // ── Inicializar Leaflet ───────────────────────────────
    const defaultLocation = [19.4326, -99.1332]; // Ciudad de México como fallback
    const map = L.map('map', {
        zoomControl: false,
        attributionControl: true
    }).setView(defaultLocation, 13);

    // Tiles con estilo moderno
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd'
    }).addTo(map);

    const myRole      = window.getMyId();
    const partnerRole = window.getPartnerId();
    const isA         = myRole === 'userA';

    // ── Iconos personalizados ──────────────────────────────
    function createDivIcon(label, color, pulse = false) {
        return L.divIcon({
            className: '',
            html: `
                <div style="
                    width:44px; height:44px; border-radius:50%;
                    background:${color}; border:3px solid white;
                    box-shadow:0 4px 12px rgba(0,0,0,0.3);
                    display:flex; align-items:center; justify-content:center;
                    color:white; font-weight:700; font-size:16px;
                    ${pulse ? 'animation:mapPulse 2s infinite;' : ''}
                ">${label}</div>
                ${pulse ? `<style>
                    @keyframes mapPulse {
                        0%,100%{box-shadow:0 4px 12px rgba(0,0,0,0.3)}
                        50%{box-shadow:0 4px 24px rgba(255,75,114,0.6)}
                    }
                </style>` : ''}
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -24]
        });
    }

    const myIcon      = createDivIcon(isA ? 'A' : 'B', '#ff4b72', true);
    const partnerIcon = createDivIcon(isA ? 'B' : 'A', '#a29bfe', false);

    let myMarker      = null;
    let partnerMarker = null;
    let hasSetInitialView = false;

    // ── Centrar mapa inteligentemente ─────────────────────
    function updateMapBounds() {
        if (myMarker && partnerMarker) {
            const group = L.featureGroup([myMarker, partnerMarker]);
            map.fitBounds(group.getBounds(), { padding: [60, 60], maxZoom: 16 });

            const dist = map.distance(myMarker.getLatLng(), partnerMarker.getLatLng());
            const distEl = document.getElementById('mapDistance');
            if (distEl) {
                distEl.innerText = dist < 1000
                    ? Math.round(dist) + ' m'
                    : (dist / 1000).toFixed(1) + ' km';
            }
        } else if (myMarker && !hasSetInitialView) {
            map.setView(myMarker.getLatLng(), 15);
            hasSetInitialView = true;
        }
    }

    // ── Mi ubicación LOCAL (instantánea, sin esperar Firebase) ──
    window.addEventListener('myLocationUpdated', (e) => {
        const { lat, lng } = e.detail;
        if (!myMarker) {
            myMarker = L.marker([lat, lng], { icon: myIcon })
                .bindPopup('📍 Tú estás aquí')
                .addTo(map);
        } else {
            myMarker.setLatLng([lat, lng]);
        }
        updateMapBounds();
    });

    // ── Ubicación de la pareja (LOCAL desde location.js) ──
    window.addEventListener('partnerLocationUpdated', (e) => {
        const { lat, lng } = e.detail;
        if (!partnerMarker) {
            partnerMarker = L.marker([lat, lng], { icon: partnerIcon })
                .bindPopup('💗 Tu pareja')
                .addTo(map);
        } else {
            partnerMarker.setLatLng([lat, lng]);
        }
        updateMapBounds();
    });

    // ── Firebase listeners (backup y sincronización) ───────
    if (rtdb) {
        // Mi ubicación desde Firebase (por si location.js no está en esta página)
        onValue(ref(rtdb, 'locations/' + myRole), (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.lat) return;
            if (!myMarker) {
                myMarker = L.marker([data.lat, data.lng], { icon: myIcon })
                    .bindPopup('📍 Tú estás aquí')
                    .addTo(map);
                updateMapBounds();
            }
        });

        // Ubicación de la pareja desde Firebase
        onValue(ref(rtdb, 'locations/' + partnerRole), (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.lat) return;
            if (!partnerMarker) {
                partnerMarker = L.marker([data.lat, data.lng], { icon: partnerIcon })
                    .bindPopup('💗 Tu pareja')
                    .addTo(map);
            } else {
                partnerMarker.setLatLng([data.lat, data.lng]);
            }
            updateMapBounds();
        });
    }

    // ── Botones de control ─────────────────────────────────
    // Centrar en MI ubicación
    const centerMeBtn = document.getElementById('centerMapBtn');
    if (centerMeBtn) {
        centerMeBtn.addEventListener('click', () => {
            if (myMarker) {
                map.setView(myMarker.getLatLng(), 16, { animate: true });
            } else {
                // Solicitar ubicación ahora
                navigator.geolocation?.getCurrentPosition((pos) => {
                    map.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true });
                });
            }
        });
    }

    // Centrar en la PAREJA
    const centerPartnerBtn = document.getElementById('centerPartnerBtn');
    if (centerPartnerBtn) {
        centerPartnerBtn.addEventListener('click', () => {
            if (partnerMarker) {
                map.setView(partnerMarker.getLatLng(), 16, { animate: true });
            }
        });
    }

    // Centrar en AMBOS
    const centerBothBtn = document.getElementById('centerBothBtn');
    if (centerBothBtn) {
        centerBothBtn.addEventListener('click', () => {
            updateMapBounds();
        });
    }
});
