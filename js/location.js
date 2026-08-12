// js/location.js
// Manejo de geolocalización en tiempo real con soporte para iOS

import { rtdb } from './firebase.js';
import {
    ref, set, onValue, serverTimestamp, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {

    const myRole = window.getMyId();
    const partnerRole = window.getPartnerId();

    // ── Elementos UI ──────────────────────────────────────
    const partnerLocationText = document.getElementById('partnerLocationText');
    const distanceText        = document.getElementById('distanceText');
    const lastUpdatedText     = document.getElementById('lastUpdatedText');
    const partnerStatus       = document.getElementById('partnerStatus');
    const partnerBattery      = document.getElementById('partnerBattery');
    const locationPermBtn     = document.getElementById('locationPermBtn');

    let myLastCoords      = null;
    let partnerLastCoords = null;
    let watchId           = null;

    // ── Haversine distance ────────────────────────────────
    function getDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function updateDistance() {
        if (myLastCoords && partnerLastCoords && distanceText) {
            const d = getDistanceKm(
                myLastCoords.lat, myLastCoords.lng,
                partnerLastCoords.lat, partnerLastCoords.lng
            );
            distanceText.innerText = d < 1
                ? Math.round(d * 1000) + ' m'
                : d.toFixed(1) + ' km';
        }
    }

    // ── Reverse geocoding (OpenStreetMap) ─────────────────
    function reverseGeocode(lat, lng, callback) {
        fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`,
            { headers: { 'Accept-Language': 'es' } }
        )
            .then(r => r.json())
            .then(geo => {
                const addr = geo.address || {};
                const place =
                    addr.city || addr.town || addr.village ||
                    addr.suburb || addr.county || 'Ubicación activa';
                callback(place);
            })
            .catch(() => callback('Ubicación recibida'));
    }

    // ── Escuchar ubicación de la pareja ───────────────────
    if (rtdb) {
        onValue(ref(rtdb, 'locations/' + partnerRole), (snapshot) => {
            const data = snapshot.val();
            if (data && data.lat && data.lng) {
                partnerLastCoords = { lat: data.lat, lng: data.lng };

                // Dispatchar evento para el mapa
                window.dispatchEvent(
                    new CustomEvent('partnerLocationUpdated', { detail: data })
                );

                reverseGeocode(data.lat, data.lng, (place) => {
                    if (partnerLocationText) partnerLocationText.innerText = place;
                });

                if (lastUpdatedText && data.timestamp) {
                    const diffMins = Math.round((Date.now() - data.timestamp) / 60000);
                    lastUpdatedText.innerText =
                        diffMins === 0 ? 'Justo ahora' :
                        diffMins < 60  ? `Hace ${diffMins} min` :
                                         `Hace ${Math.floor(diffMins / 60)}h`;
                }

                updateDistance();
            }
        });

        // Escuchar batería de la pareja
        onValue(ref(rtdb, 'battery/' + partnerRole), (snapshot) => {
            const data = snapshot.val();
            if (data && partnerBattery) {
                partnerBattery.innerText = data.level + '%';
            }
        });

        // ── Estado online/offline de la pareja ─────────────
        onValue(ref(rtdb, 'status/' + partnerRole), (snapshot) => {
            const data = snapshot.val();
            if (!partnerStatus || !data) return;
            if (data.online) {
                partnerStatus.className = 'status-badge';
                partnerStatus.innerHTML =
                    '<div class="status-dot"></div><span>En línea</span>';
            } else {
                partnerStatus.className = 'status-badge offline';
                let lastSeenTxt = 'Desconectada/o';
                if (data.last_changed) {
                    const diff = Math.round((Date.now() - data.last_changed) / 60000);
                    lastSeenTxt =
                        diff < 60
                            ? `Hace ${diff}m`
                            : `Hace ${Math.floor(diff / 60)}h`;
                }
                partnerStatus.innerHTML =
                    `<div class="status-dot"></div><span>${lastSeenTxt}</span>`;
            }
        });

        // ── Mi estado online ───────────────────────────────
        const myStatusRef = ref(rtdb, 'status/' + myRole);
        set(myStatusRef, { online: true, last_changed: serverTimestamp() })
            .catch(e => console.warn('[Status] Error:', e));
        onDisconnect(myStatusRef)
            .set({ online: false, last_changed: serverTimestamp() })
            .catch(e => console.warn('[OnDisconnect] Error:', e));
    }

    // ── Geolocalización ───────────────────────────────────
    function onLocationSuccess(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        myLastCoords = { lat, lng };

        // Ocultar botón de permiso si existe
        if (locationPermBtn) locationPermBtn.style.display = 'none';

        // Evento local para el mapa (sin esperar Firebase)
        window.dispatchEvent(
            new CustomEvent('myLocationUpdated', { detail: { lat, lng } })
        );

        // Subir a Firebase
        if (rtdb) {
            const sharingEnabled = localStorage.getItem('sharingLocation') !== 'false';
            if (!sharingEnabled) return;

            set(ref(rtdb, 'locations/' + myRole), {
                lat, lng,
                timestamp: serverTimestamp(),
                accuracy: position.coords.accuracy
            }).catch(e => console.warn('[Location] Firebase error:', e));

            // Subir batería si está disponible
            if ('getBattery' in navigator) {
                navigator.getBattery().then(battery => {
                    const pct = Math.round(battery.level * 100);
                    set(ref(rtdb, 'battery/' + myRole), { level: pct })
                        .catch(() => {});
                });
            }
        }

        updateDistance();
    }

    function onLocationError(error) {
        console.warn('[Geolocation] Error:', error.code, error.message);

        let msg = 'Sin ubicación';
        switch (error.code) {
            case 1: // PERMISSION_DENIED
                msg = 'Permiso denegado';
                if (locationPermBtn) {
                    locationPermBtn.style.display = 'block';
                    locationPermBtn.innerText = '📍 Permitir ubicación en Ajustes';
                }
                if (partnerLocationText && partnerLocationText.innerText === 'Buscando...')
                    partnerLocationText.innerText = 'Esperando permiso...';
                break;
            case 2: // POSITION_UNAVAILABLE
                msg = 'GPS no disponible';
                break;
            case 3: // TIMEOUT
                // En iOS es normal que el primer intento tarde, reintentar
                console.warn('[Geolocation] Timeout, reintentando...');
                startTracking();
                return;
        }
        console.warn('[Geolocation]', msg);
    }

    // Opciones optimizadas para iOS Safari
    const geoOptions = {
        enableHighAccuracy: true,
        maximumAge: 10000,    // Acepta caché de hasta 10 segundos
        timeout: 20000        // 20 segundos antes de timeout
    };

    function startTracking() {
        if (!('geolocation' in navigator)) {
            console.warn('[Geolocation] No soportado en este navegador');
            if (partnerLocationText)
                partnerLocationText.innerText = 'GPS no disponible';
            return;
        }

        // En iOS, hay que llamar primero getCurrentPosition para solicitar permiso
        // antes de watchPosition para que funcione correctamente
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onLocationSuccess(pos);
                // Una vez obtenida la primera posición, iniciar watchPosition
                if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                watchId = navigator.geolocation.watchPosition(
                    onLocationSuccess,
                    onLocationError,
                    geoOptions
                );
            },
            (err) => {
                onLocationError(err);
                // Intentar watchPosition de todas formas (puede funcionar después del prompt)
                if (err.code !== 1) { // No PERMISSION_DENIED
                    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                    watchId = navigator.geolocation.watchPosition(
                        onLocationSuccess,
                        onLocationError,
                        geoOptions
                    );
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }

    startTracking();

    // Limpiar al salir de la página
    window.addEventListener('beforeunload', () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
    });
});
