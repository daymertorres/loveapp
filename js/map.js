// js/map.js

import { rtdb } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');
    
    if (mapElement) {
        // Inicializar mapa de Leaflet
        // Coordenadas por defecto (Centro de la ciudad, por ejemplo)
        const defaultLocation = [40.416775, -3.703790]; 
        const map = L.map('map', { zoomControl: false }).setView(defaultLocation, 14);

        // Añadir capa de OpenStreetMap (estilo oscuro o claro basado en el tema podría configurarse aquí)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors & CARTO',
            maxZoom: 19
        }).addTo(map);

        // Crear iconos personalizados
        const myIcon = L.divIcon({
            className: 'custom-marker my-marker',
            html: 'M', // Inicial del nombre
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const partnerIcon = L.divIcon({
            className: 'custom-marker partner',
            html: '<i class="fa-solid fa-heart"></i>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });


        
        const myRole = window.getMyId ? window.getMyId() : localStorage.getItem('myRole') || 'userA';
        const partnerRole = window.getPartnerId ? window.getPartnerId() : localStorage.getItem('partnerRole') || 'userB';
        
        let myMarker = null;
        let partnerMarker = null;
        
        // Escuchar mi ubicación para el mapa (desde Firebase, por si acaso)
        try {
            onValue(ref(rtdb, 'locations/' + myRole), (snapshot) => {
                const data = snapshot.val();
                if(data && data.lat) {
                    if(!myMarker) {
                        myMarker = L.marker([data.lat, data.lng], {icon: myIcon}).addTo(map);
                    } else {
                        myMarker.setLatLng([data.lat, data.lng]);
                    }
                    updateMapBounds();
                }
            });
        } catch(e) {}
        
        // Escuchar mi ubicación LOCALMENTE (Instantáneo, incluso si Firebase falla)
        window.addEventListener('myLocationUpdated', (e) => {
            const data = e.detail;
            if(!myMarker) {
                myMarker = L.marker([data.lat, data.lng], {icon: myIcon}).addTo(map);
            } else {
                myMarker.setLatLng([data.lat, data.lng]);
            }
            updateMapBounds();
        });
        
        // Escuchar ubicación pareja
        try {
            onValue(ref(rtdb, 'locations/' + partnerRole), (snapshot) => {
                const data = snapshot.val();
                if(data && data.lat) {
                    if(!partnerMarker) {
                        partnerMarker = L.marker([data.lat, data.lng], {icon: partnerIcon}).addTo(map);
                    } else {
                        partnerMarker.setLatLng([data.lat, data.lng]);
                    }
                    updateMapBounds();
                }
            });
        } catch(e) {}
        
        function updateMapBounds() {
            if (myMarker && partnerMarker) {
                const group = new L.featureGroup([myMarker, partnerMarker]);
                map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
                
                // Actualizar UI distancia si estamos en el mapa
                const dist = map.distance(myMarker.getLatLng(), partnerMarker.getLatLng());
                const distanceEl = document.getElementById('mapDistance');
                if (distanceEl) {
                    distanceEl.innerText = (dist / 1000).toFixed(1) + ' km';
                }
            } else if (myMarker) {
                map.setView(myMarker.getLatLng(), 15);
            }
        }

        const centerBtn = document.getElementById('centerMapBtn');
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                if (partnerMarker) {
                    map.setView(partnerMarker.getLatLng(), 16);
                }
            });
        }
    }
});
