// js/map.js
// Mapa interactivo con Leaflet + Firebase Realtime Database

import { rtdb } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // ── Inicializar Leaflet ───────────────────────────────────
    const defaultLocation = [19.4326, -99.1332]; // CDMX como fallback
    const map = L.map('map', {
        zoomControl: false,
        attributionControl: true
    }).setView(defaultLocation, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM &copy; CARTO',
        maxZoom: 19,
        subdomains: 'abcd'
    }).addTo(map);

    const myRole      = window.getMyId();
    const partnerRole = window.getPartnerId();
    const isA         = myRole === 'userA';

    // ── Iconos: usar clases CSS (más fiable que inline flex en Leaflet) ──
    // La clase 'map-pin-wrap' resetea los estilos de Leaflet
    // La clase 'map-pin' aplica el estilo del círculo
    const myIcon = L.divIcon({
        className:  'map-pin-wrap',
        html:       `<div class="map-pin map-pin-me">${isA ? 'A' : 'B'}</div>`,
        iconSize:   [46, 46],
        iconAnchor: [23, 23],
        popupAnchor:[0, -26]
    });

    const partnerIcon = L.divIcon({
        className:  'map-pin-wrap',
        html:       `<div class="map-pin map-pin-partner">${isA ? 'B' : 'A'}</div>`,
        iconSize:   [46, 46],
        iconAnchor: [23, 23],
        popupAnchor:[0, -26]
    });

    let myMarker      = null;
    let partnerMarker = null;
    let hasViewedMe   = false;

    // ── Centrar mapa inteligentemente ─────────────────────────
    function updateMapBounds() {
        if (myMarker && partnerMarker) {
            const group = L.featureGroup([myMarker, partnerMarker]);
            try {
                map.fitBounds(group.getBounds(), { padding: [70, 70], maxZoom: 16, animate: true });
            } catch(e) {}

            const dist = map.distance(myMarker.getLatLng(), partnerMarker.getLatLng());
            const distEl = document.getElementById('mapDistance');
            if (distEl) {
                distEl.innerText = dist < 1000
                    ? Math.round(dist) + ' m'
                    : (dist / 1000).toFixed(1) + ' km';
            }
        } else if (myMarker && !hasViewedMe) {
            map.setView(myMarker.getLatLng(), 15, { animate: true });
            hasViewedMe = true;
        } else if (partnerMarker && !hasViewedMe) {
            // Si solo hay pareja pero no yo, centramos en ella
            map.setView(partnerMarker.getLatLng(), 15, { animate: true });
            hasViewedMe = true;
        }
    }

    // ── Helper: colocar/actualizar mi marker ─────────────────
    function setMyMarker(lat, lng) {
        if (!myMarker) {
            myMarker = L.marker([lat, lng], { icon: myIcon, zIndexOffset: 100 })
                .bindPopup('<b>📍 Tú estás aquí</b>')
                .addTo(map);
        } else {
            myMarker.setLatLng([lat, lng]);
        }
        updateMapBounds();
    }

    // ── Helper: colocar/actualizar marker de la pareja ───────
    function setPartnerMarker(lat, lng) {
        if (!partnerMarker) {
            partnerMarker = L.marker([lat, lng], { icon: partnerIcon })
                .bindPopup('<b>💗 Tu pareja</b>')
                .addTo(map);
        } else {
            partnerMarker.setLatLng([lat, lng]);
        }
        updateMapBounds();
    }

    // ── Mi ubicación LOCAL desde location.js (evento instantáneo) ──
    window.addEventListener('myLocationUpdated', (e) => {
        setMyMarker(e.detail.lat, e.detail.lng);
    });

    // ── Ubicación de la PAREJA desde location.js (evento) ────
    // Este evento puede llegar tarde (race condition), por eso
    // también escuchamos Firebase directamente (ver abajo).
    window.addEventListener('partnerLocationUpdated', (e) => {
        setPartnerMarker(e.detail.lat, e.detail.lng);
    });

    // ── Firebase: fuente principal para AMBAS ubicaciones ────
    // Esto garantiza que funciona aunque los eventos lleguen
    // antes de que map.js esté listo
    if (rtdb) {
        // Mi ubicación en Firebase (backup del evento)
        onValue(ref(rtdb, 'locations/' + myRole), (snapshot) => {
            const data = snapshot.val();
            if (data && data.lat && data.lng) {
                setMyMarker(data.lat, data.lng);
            }
        });

        // Ubicación de la PAREJA en Firebase (principal para B→A y A→B)
        onValue(ref(rtdb, 'locations/' + partnerRole), (snapshot) => {
            const data = snapshot.val();
            if (data && data.lat && data.lng) {
                setPartnerMarker(data.lat, data.lng);

                // Ocultar banner "sin pareja"
                const noBanner = document.getElementById('noPartnerBanner');
                if (noBanner) noBanner.style.display = 'none';
            } else {
                // Pareja sin ubicación aún
                const noBanner = document.getElementById('noPartnerBanner');
                if (noBanner) noBanner.style.display = 'block';
            }
        });

        // Detectar conectividad con Firebase RTDB
        onValue(ref(rtdb, '.info/connected'), (snapshot) => {
            const connected = snapshot.val() === true;
            const indicator = document.getElementById('rtdbStatus');
            if (indicator) {
                indicator.style.display = connected ? 'none' : 'flex';
            }
            console.log('[Firebase RTDB]', connected ? 'Conectado ✓' : 'Sin conexión ✗');
        });
    } else {
        // Firebase no inicializado
        const indicator = document.getElementById('rtdbStatus');
        if (indicator) indicator.style.display = 'flex';
    }

    // ── Botones de control ────────────────────────────────────
    document.getElementById('centerMapBtn')?.addEventListener('click', () => {
        if (myMarker) {
            map.setView(myMarker.getLatLng(), 16, { animate: true });
        } else {
            navigator.geolocation?.getCurrentPosition(pos => {
                map.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true });
            });
        }
    });

    document.getElementById('centerPartnerBtn')?.addEventListener('click', () => {
        if (partnerMarker) {
            map.setView(partnerMarker.getLatLng(), 16, { animate: true });
        }
    });

    document.getElementById('centerBothBtn')?.addEventListener('click', () => {
        hasViewedMe = false; // Forzar re-centrado
        updateMapBounds();
    });
});
