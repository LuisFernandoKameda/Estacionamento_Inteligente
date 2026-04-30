const mqtt = require("mqtt");
const { v4: uuidv4 } = require("uuid");

// ⚠️ Codespaces/local → usar localhost
const client = mqtt.connect("mqtt://localhost:1883");

// CONFIG
const SIMULATION_SPEED = 1000; // 1s = 1 minuto
const MIN_STAY = 60;   // minutos
const MAX_STAY = 240;  // minutos

// Horários de pico
const PEAK_HOURS = [
  { start: 7 * 60, end: 10 * 60 },
  { start: 17 * 60, end: 20 * 60 }
];

// Criar vagas
const sectors = ["A", "B", "C"];
const spots = {};

// Inicialização
sectors.forEach(sector => {
  spots[sector] = [];

  for (let i = 1; i <= 30; i++) {
    const spotId = `${sector}-${String(i).padStart(2, "0")}`;

    spots[sector].push({
      spotId,
      state: "FREE",
      occupiedUntil: null
    });
  }
});

// Tempo simulado (começa 06:00)
let simulatedTime = 6 * 60;

// ----------------------
// FUNÇÕES AUXILIARES
// ----------------------

function isPeak(time) {
  return PEAK_HOURS.some(p => time >= p.start && time <= p.end);
}

function getArrivalChance(time) {
  return isPeak(time) ? 0.05 : 0.01;
}

function getStayDuration() {
  return Math.floor(Math.random() * (MAX_STAY - MIN_STAY)) + MIN_STAY;
}

function getSectorOccupancy(sector) {
  const total = spots[sector].length;

  const occupied = spots[sector].filter(
    s => s.state === "OCCUPIED"
  ).length;

  return occupied / total;
}

function publishEvent(sector, spot) {
  const event = {
    eventId: uuidv4(),
    ts: new Date().toISOString(),
    sectorId: sector,
    spotId: spot.spotId,
    state: spot.state,
    source: "sensor"
  };

  const topic = `campus/parking/sectors/${sector}/spots/${spot.spotId}/events`;

  client.publish(topic, JSON.stringify(event));

  console.log(`[MQTT] ${topic} → ${spot.state}`);
}

function logStatus() {
  sectors.forEach(sector => {
    const occ = getSectorOccupancy(sector);
    console.log(`📊 Setor ${sector}: ${(occ * 100).toFixed(1)}% ocupado`);
  });
}

// ----------------------
// SIMULAÇÃO
// ----------------------

function simulateStep() {
  simulatedTime++;

  // Resetar dia
  if (simulatedTime >= 24 * 60) {
    simulatedTime = 0;
  }

  sectors.forEach(sector => {
    spots[sector].forEach(spot => {

      // Se está ocupada → verificar saída
      if (spot.state === "OCCUPIED") {
        if (simulatedTime >= spot.occupiedUntil) {
          spot.state = "FREE";
          spot.occupiedUntil = null;
          publishEvent(sector, spot);
        }
        return;
      }

      // Se está livre → pode receber carro
      const chance = getArrivalChance(simulatedTime);
      const occupancy = getSectorOccupancy(sector);

      // Evita lotação instantânea
      if (occupancy < 1 && Math.random() < chance) {
        spot.state = "OCCUPIED";
        spot.occupiedUntil = simulatedTime + getStayDuration();
        publishEvent(sector, spot);
      }

    });
  });

  // Log a cada 10 minutos simulados
  if (simulatedTime % 10 === 0) {
    console.log(`\n🕒 Hora simulada: ${Math.floor(simulatedTime / 60)}:${(simulatedTime % 60).toString().padStart(2, "0")}`);
    logStatus();
    console.log("");
  }
}

// ----------------------
// MQTT
// ----------------------

client.on("connect", () => {
  console.log("🚀 Simulador conectado ao MQTT");
  setInterval(simulateStep, SIMULATION_SPEED);
});

client.on("error", (err) => {
  console.error("❌ Erro MQTT:", err.message);
});