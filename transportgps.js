const modal = document.getElementById("transitModal");
const startBtn = document.getElementById("startTracking");
const stopBtn = document.getElementById("stopTracking");
const closeBtn = document.getElementById("closeTransit");

const gpsMessage = document.getElementById("gpsMessage");
const distanceInfo = document.getElementById("distanceInfo");
const petBubble = document.getElementById("petBubble");

const CAR_EMISSION = 0.17; 
const PUBLIC_TRANSPORT_EMISSION = 0.06;
const ECO_TOKEN_REWARD = 10;

let watchID = null;
let previousPosition = null;
let totalDistance = 0;
let tracking = false;

function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const toRad = value => value * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return R * c;
}

// Membuka popup
document.getElementById("startTransitQuest")
  ?.addEventListener("click", () => {

    modal.classList.add("active");

  });

// Memulai GPS
startBtn.addEventListener("click", () => {

  if (!navigator.geolocation) {
    gpsMessage.textContent =
      "Browser kamu tidak mendukung GPS.";
    return;
  }

  if (tracking) return;

  gpsMessage.textContent =
    "Meminta izin lokasi...";

  navigator.geolocation.getCurrentPosition(

    () => {

      tracking = true;
      totalDistance = 0;
      previousPosition = null;

      startBtn.hidden = true;
      stopBtn.hidden = false;

      gpsMessage.textContent =
        "GPS aktif! Perjalanan sedang dihitung.";

      watchID = navigator.geolocation.watchPosition(

        position => {

          const { latitude, longitude, accuracy } =
            position.coords;

          // Abaikan koordinat dengan akurasi buruk
          if (accuracy > 50) return;

          const currentPosition = {
            lat: latitude,
            lon: longitude
          };

          if (previousPosition) {

            const distance = calculateDistance(
              previousPosition.lat,
              previousPosition.lon,
              currentPosition.lat,
              currentPosition.lon
            );

            // Mengurangi kesalahan akibat GPS drift
            if (distance >= 0.015 && distance <= 0.5) {
              totalDistance += distance;
            }

          }

          previousPosition = currentPosition;

          distanceInfo.textContent =
            "Jarak perjalanan: " +
            totalDistance.toFixed(2) + " km";

        },

        error => {

          gpsMessage.textContent =
            "Lokasi gagal dibaca. Periksa izin GPS.";

          tracking = false;
          startBtn.hidden = false;
          stopBtn.hidden = true;

        },

        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000
        }

      );

    },

    error => {

      gpsMessage.textContent =
        "Izin lokasi diperlukan untuk menjalankan quest.";

    },

    {
      enableHighAccuracy: true,
      timeout: 15000
    }

  );

});

// Mengakhiri perjalanan
stopBtn.addEventListener("click", () => {

  if (!tracking) return;

  navigator.geolocation.clearWatch(watchID);

  tracking = false;

  const distance = totalDistance;

  distanceInfo.textContent =
    "Total jarak: " + distance.toFixed(2) + " km";

  if (distance < 0.5) {

    gpsMessage.textContent =
      "Perjalanan belum memenuhi jarak minimum. Quest belum selesai.";

    startBtn.hidden = false;
    stopBtn.hidden = true;

    return;
  }

  // Pengguna harus mengonfirmasi bahwa
  // perjalanan memang menggunakan transportasi umum.
  const confirmation = confirm(
    "Apakah kamu benar-benar menggunakan transportasi umum?"
  );

  if (!confirmation) {

    gpsMessage.textContent =
      "Quest belum diselesaikan.";

    startBtn.hidden = false;
    stopBtn.hidden = true;

    return;
  }

  // Estimasi emisi yang dihindari
  const emissionSaved =
    distance * (
      CAR_EMISSION - PUBLIC_TRANSPORT_EMISSION
    );

  const result = emissionSaved.toFixed(2);

  // Tampilkan hasil di bubble pet
  petBubble.textContent =
    "Selamat! Kamu telah mengurangi sekitar " +
    result + " kg CO2e! 🌱";

  // Reward prototype
  addEcoTokens(ECO_TOKEN_REWARD);

  gpsMessage.textContent =
    "Quest berhasil diselesaikan!";

  startBtn.hidden = false;
  stopBtn.hidden = true;

});

// Fungsi penambahan Eco-Token
function addEcoTokens(amount) {

  // Sesuaikan dengan sistem token website kamu
  const tokenElement =
    document.getElementById("ecoTokens");

  if (tokenElement) {

    const currentTokens =
      Number(tokenElement.textContent) || 0;

    tokenElement.textContent =
      currentTokens + amount;

  }

}

// Menutup popup
closeBtn.addEventListener("click", () => {

  // Jangan biarkan tracking berjalan diam-diam
  if (tracking) {
    navigator.geolocation.clearWatch(watchID);
    tracking = false;
  }

  modal.classList.remove("active");

});
