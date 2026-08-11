// js/location.js

document.addEventListener('DOMContentLoaded', () => {
    import { rtdb } from './firebase.js';
    import { ref, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
    
    // Obtener roles de localStorage
    const myRole = window.getMyId ? window.getMyId() : localStorage.getItem('myRole') || 'userA';
    const partnerRole = window.getPartnerId ? window.getPartnerId() : localStorage.getItem('partnerRole') || 'userB';
    
    // UI Elements
    const partnerLocationText = document.getElementById('partnerLocationText');
    const distanceText = document.getElementById('distanceText');
    const lastUpdatedText = document.getElementById('lastUpdatedText');
    const partnerStatus = document.getElementById('partnerStatus');
    
    let myLastCoords = null;
    let partnerLastCoords = null;

    // Escuchar ubicación de la pareja
    const partnerLocRef = ref(rtdb, 'locations/' + partnerRole);
    onValue(partnerLocRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.lat && data.lng) {
            partnerLastCoords = { lat: data.lat, lng: data.lng };
            
            // Reverse Geocoding simple (OpenStreetMap Nominatim) para mostrar la ciudad
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.lat}&lon=${data.lng}&zoom=10`)
                .then(res => res.json())
                .then(geo => {
                    if (partnerLocationText) {
                        partnerLocationText.innerText = geo.address.city || geo.address.town || geo.address.village || "Ubicación actualizada";
                    }
                }).catch(() => {
                    if (partnerLocationText) partnerLocationText.innerText = "Coordenadas recibidas";
                });
                
            // Actualizar tiempo
            if (lastUpdatedText && data.timestamp) {
                const diffMins = Math.round((Date.now() - data.timestamp) / 60000);
                lastUpdatedText.innerText = diffMins === 0 ? "Justo ahora" : `Hace ${diffMins} min`;
            }
            
            updateDistance();
        }
    });
    
    // Escuchar estado (online/offline)
    const partnerStatusRef = ref(rtdb, 'status/' + partnerRole);
    onValue(partnerStatusRef, (snapshot) => {
        const data = snapshot.val();
        if (partnerStatus && data) {
            if (data.online) {
                partnerStatus.className = 'status-badge';
                partnerStatus.innerHTML = '<div class="status-dot"></div><span>En línea</span>';
            } else {
                partnerStatus.className = 'status-badge offline';
                
                let lastSeenTxt = "Desconectado";
                if(data.last_changed) {
                   const diffMins = Math.round((Date.now() - data.last_changed) / 60000);
                   if (diffMins < 60) lastSeenTxt = `Hace ${diffMins}m`;
                   else lastSeenTxt = `Hace ${Math.floor(diffMins/60)}h`;
                }
                partnerStatus.innerHTML = `<div class="status-dot"></div><span>${lastSeenTxt}</span>`;
            }
        }
    });

    // Registrar mi propio estado
    const myStatusRef = ref(rtdb, 'status/' + myRole);
    import { onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
    
    set(myStatusRef, { online: true, last_changed: serverTimestamp() });
    onDisconnect(myStatusRef).set({ online: false, last_changed: serverTimestamp() });
    
    // Función para obtener mi ubicación (Usando Geolocation API)
    const updateMyLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                console.log(`Mi ubicación: ${lat}, ${lng}`);
                myLastCoords = { lat, lng };
                
                // Enviar a Firebase
                const myLocRef = ref(rtdb, 'locations/' + myRole);
                set(myLocRef, { lat, lng, timestamp: serverTimestamp() });
                
                updateDistance();
            }, (error) => {
                console.warn("Error obteniendo ubicación:", error.message);
            }, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        }
    };
    
    updateMyLocation();
    
    // Actualizar cada 30 segundos
    setInterval(updateMyLocation, 30000);
    
    // Haversine formula para calcular distancia
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;  
      const dLon = (lon2 - lon1) * Math.PI / 180; 
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c; 
    }
    
    function updateDistance() {
        if (myLastCoords && partnerLastCoords && distanceText) {
            const d = getDistanceFromLatLonInKm(myLastCoords.lat, myLastCoords.lng, partnerLastCoords.lat, partnerLastCoords.lng);
            distanceText.innerText = d.toFixed(1) + ' km';
        }
    }
});
