import { Storage } from './storage.js';
import { VERSION } from './version.js';

// State
let currentPhotoBlob = null;
let currentLocation = { lat: null, lon: null };

// Navigation
window.showScreen = (screenId) => {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        if(el.id === 'screen-loading') {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });

    // Show target
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        // Special handling for loading screen
        if(screenId === 'screen-loading') {
            target.classList.remove('hidden');
            target.classList.add('flex');
        }
        
        // Trigger specific screen logic
        if(screenId === 'screen-dashboard') loadDashboard();
        if(screenId === 'screen-capture') initCaptureScreen();
    }
};

// --- Auth Logic ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('button');
    const originalText = btn.innerText;
    
    // Simulate loading
    btn.innerText = 'Verificando...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.disabled = false;
        // Simple mock auth
        localStorage.setItem('infotic_user', 'inspector01');
        window.showScreen('screen-dashboard');
    }, 800);
});

// --- Dashboard Logic ---
function loadDashboard() {
    const evidences = Storage.get();
    
    // Update count
    document.getElementById('evidence-count').innerText = evidences.length;
    
    const listEl = document.getElementById('evidence-list');
    listEl.innerHTML = ''; // Clear current list

    if (evidences.length === 0) {
        listEl.innerHTML = `
            <div id="empty-state" class="flex flex-col items-center justify-center py-10 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm">No hay evidencias registradas</p>
            </div>
        `;
    } else {
        // Render list (reversed to show newest first)
        evidences.slice().reverse().forEach(item => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString();
            
            const div = document.createElement('div');
            div.className = "bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between animation-fade-in-up mb-3";
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        ${item.photo ? `<img src="${item.photo}" class="w-full h-full object-cover" />` : '<span class="text-xs text-gray-400">No IMG</span>'}
                    </div>
                    <div>
                        <p class="font-bold text-gray-800 text-sm">${item.nodeId}</p>
                        <p class="text-xs text-gray-500">${item.type} • ${dateStr} ${timeStr}</p>
                    </div>
                </div>
                <div class="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
            `;
            listEl.appendChild(div);
        });
    }
}

// --- Capture Logic ---
function initCaptureScreen() {
    // Reset form
    document.getElementById('capture-form').reset();
    resetPhotoUI();
    
    // Start Geolocation
    const geoStatus = document.getElementById('geo-status');
    geoStatus.innerText = 'Detectando ubicación...';
    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            geoStatus.innerHTML = `Lat ${currentLocation.lat.toFixed(4)}, Lon ${currentLocation.lon.toFixed(4)}`;
        }, (error) => {
            console.error(error);
            geoStatus.innerText = 'Ubicación no disponible (GPS Error)';
            currentLocation = { lat: 0, lon: 0 };
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    } else {
        geoStatus.innerText = 'Geolocalización no soportada';
    }
}

// Camera Handling
const cameraInput = document.getElementById('camera-input');
const photoBtn = document.getElementById('photo-btn');
const photoPreview = document.getElementById('photo-preview');
const photoPlaceholder = document.getElementById('photo-placeholder');
const photoText = document.getElementById('photo-text');

// Trigger hidden input
window.triggerCamera = () => {
    cameraInput.click();
};

cameraInput.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            currentPhotoBlob = e.target.result; // Base64 string
            
            // Update UI
            photoPreview.src = currentPhotoBlob;
            photoPreview.classList.remove('hidden');
            photoPlaceholder.classList.add('hidden');
            
            photoBtn.classList.add('photo-btn-active', 'border-solid');
            photoBtn.classList.remove('bg-gray-50', 'text-gray-500', 'border-dashed');
            
            photoText.innerText = "Foto Capturada";
        };
        
        reader.readAsDataURL(file);
    }
});

function resetPhotoUI() {
    currentPhotoBlob = null;
    photoPreview.src = '';
    photoPreview.classList.add('hidden');
    photoPlaceholder.classList.remove('hidden');
    
    photoBtn.classList.remove('photo-btn-active', 'border-solid');
    photoBtn.classList.add('bg-gray-50', 'text-gray-500', 'border-dashed');
    photoText.innerText = "Tomar Foto / Adjuntar";
}

// Submit Logic
window.submitEvidence = () => {
    const nodeId = document.getElementById('node-id').value;
    const type = document.getElementById('evidence-type').value;

    if (!nodeId) {
        alert("Por favor ingrese el ID del Nodo");
        return;
    }
    
    if (!currentPhotoBlob) {
        alert("Por favor tome una foto de la evidencia");
        return;
    }

    // Show Loading
    window.showScreen('screen-loading');
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('success-state').classList.add('hidden');
    
    // Animate Bar
    const bar = document.getElementById('progress-bar-fill');
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = '100%'; }, 100);

    // Save Data
    const newEvidence = {
        id: Date.now(),
        nodeId,
        type,
        photo: currentPhotoBlob,
        location: currentLocation,
        timestamp: new Date().toISOString()
    };
    
    // Simulate Network Delay
    setTimeout(() => {
        const saved = Storage.add(newEvidence);
        
        if (saved) {
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('success-state').classList.remove('hidden');
        } else {
            alert('Error al guardar. Almacenamiento lleno?');
            window.showScreen('screen-capture');
        }
    }, 2100);
};

// Expose navigation functions to global scope for HTML onclick attributes
window.goToDashboard = () => window.showScreen('screen-dashboard');
window.goToCapture = () => window.showScreen('screen-capture');
window.finishUpload = () => window.showScreen('screen-dashboard');

// Init
document.addEventListener('DOMContentLoaded', () => {
    const current = localStorage.getItem('infotic_version');
    const versionEl = document.getElementById('version-label');
    if (versionEl) versionEl.innerText = `v${VERSION}`;
    if (current !== VERSION) {
        const banner = document.getElementById('update-banner');
        const textEl = document.getElementById('update-text');
        if (textEl) textEl.innerText = `Actualizado a v${VERSION}`;
        if (banner) {
            banner.classList.remove('hidden');
            setTimeout(() => banner.classList.add('hidden'), 3000);
        }
        localStorage.setItem('infotic_version', VERSION);
    }
});
