const path = require("path");

const express = require("express");
const mqtt = require("mqtt");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ----------------------
// BANCO
// ----------------------

const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "parking",
  password: "1234",
  port: 5432
});

// ----------------------
// MQTT
// ----------------------

const client = mqtt.connect("mqtt://localhost:1883");

// controle de recomendação
let lastRecommendation = {};

// histórico de eventos (para incidentes)
let spotHistory = {};

// ----------------------
// MQTT CONSUMER
// ----------------------

client.on("connect", () => {
  console.log("📡 Backend conectado ao MQTT");
  client.subscribe("campus/parking/sectors/+/spots/+/events");
});

client.on("message", async (topic, message) => {
  const event = JSON.parse(message.toString());

  // ----------------------
  // IDEMPOTÊNCIA
  // ----------------------

  const exists = await db.query(
    "SELECT 1 FROM spot_events WHERE eventId = $1",
    [event.eventId]
  );

  if (exists.rowCount > 0) return;

  // ----------------------
  // SALVAR EVENTO
  // ----------------------

  await db.query(`
    INSERT INTO spot_events VALUES ($1,$2,$3,$4,$5,$6)
  `, [
    event.eventId,
    event.ts,
    event.sectorId,
    event.spotId,
    event.state,
    event
  ]);

  await db.query(`
    UPDATE spots
    SET currentState=$1, lastChangeTs=$2, lastEventId=$3
    WHERE spotId=$4
  `, [event.state, event.ts, event.eventId, event.spotId]);

  // ----------------------
  // INCIDENTES
  // ----------------------

  handleIncidents(event);

  

  // ----------------------
  // RECOMENDAÇÃO
  // ----------------------

  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE currentState='OCCUPIED') as occupied,
      COUNT(*) as total
    FROM spots
    WHERE sectorId = $1
  `, [event.sectorId]);

  const occupied = Number(result.rows[0].occupied);
  const total = Number(result.rows[0].total);

  const occupancyRate = occupied / total;

  const now = Date.now();
  const lastTime = lastRecommendation[event.sectorId] || 0;

  if (occupancyRate >= 0.9 && (now - lastTime > 30000)) {

    lastRecommendation[event.sectorId] = now;

    const best = await db.query(`
      SELECT 
        sectorId AS "sectorId",
        COUNT(*) FILTER (WHERE currentState='FREE') AS free
        FROM spots
        WHERE sectorId != $1
        GROUP BY sectorId
        ORDER BY free DESC
        LIMIT 1
    `, [event.sectorId]);

    const recommended = best.rows[0];

    if (!recommended || recommended.free == 0) return;

    const response = {
      fromSector: event.sectorId,
      recommendedSector: recommended.sectorId,
      reason: `Sector ${event.sectorId} at ${(occupancyRate*100).toFixed(0)}% occupancy; Sector ${recommended.sectorId} has ${recommended.free} free spots`,
      ts: new Date().toISOString()
    };

    console.log("🚨 RECOMENDAÇÃO:", response);

    await db.query(`
      INSERT INTO recommendations_log (ts, fromSector, recommendedSector, reason, dataJson)
      VALUES ($1,$2,$3,$4,$5)
    `, [
      response.ts,
      response.fromSector,
      response.recommendedSector,
      response.reason,
      JSON.stringify(response)
    ]);
  }
});


function handleIncidents(event) {
    const forced = forcedFailures[event.spotId];

    if (forced) {
        createIncident(event, forced.toUpperCase(), "HIGH");
        return;
}
  const key = event.spotId;

  if (!spotHistory[key]) {
    spotHistory[key] = [];
  }

  const history = spotHistory[key];

  history.push({
    state: event.state,
    ts: Date.now()
  });

  // manter só últimos 10 eventos
  if (history.length > 10) {
    history.shift();
  }

  detectFlapping(event, history);
  detectStuck(event, history);
}


function detectFlapping(event, history) {
  if (history.length < 5) return;

  const changes = history.slice(-5);

  let alternations = 0;

  for (let i = 1; i < changes.length; i++) {
    if (changes[i].state !== changes[i - 1].state) {
      alternations++;
    }
  }

  if (alternations >= 4) {
    createIncident(event, "FLAPPING", "HIGH");
  }
}


function detectStuck(event, history) {
  if (history.length < 5) return;

  const now = Date.now();
  const first = history[0];

  const duration = (now - first.ts) / 1000; // segundos

  const sameState = history.every(h => h.state === history[0].state);

  if (sameState && duration > 60) {
    const type = history[0].state === "OCCUPIED"
      ? "STUCK_OCCUPIED"
      : "STUCK_FREE";

    createIncident(event, type, "MEDIUM");
  }
}


async function createIncident(event, type, severity) {
  console.log(`⚠️ INCIDENTE: ${type} em ${event.spotId}`);

  await db.query(`
    INSERT INTO incidents (tsOpen, type, severity, sectorId, spotId, status)
    VALUES ($1,$2,$3,$4,$5,'open')
  `, [
    new Date().toISOString(),
    type,
    severity,
    event.sectorId,
    event.spotId
  ]);
}

//mapa

app.get("/api/v1/map", async (req, res) => {
  const result = await db.query("SELECT * FROM spots");
  res.json(result.rows);
});

//setor

app.get("/api/v1/sectors", async (req, res) => {
  const result = await db.query(`
    SELECT sectorId,
      COUNT(*) FILTER (WHERE currentState='OCCUPIED') as occupied,
      COUNT(*) FILTER (WHERE currentState='FREE') as free
    FROM spots
    GROUP BY sectorId
  `);

  res.json(result.rows);
});

//incidente

app.get("/api/v1/incidents", async (req, res) => {
  const result = await db.query(`
    SELECT * FROM incidents WHERE status='open'
  `);

  res.json(result.rows);
});

//recomendacao

app.get("/api/v1/recommendation", async (req, res) => {
  const { fromSector } = req.query;

  const result = await db.query(`
    SELECT * FROM recommendations_log
    WHERE fromSector = $1
    ORDER BY ts DESC
    LIMIT 1
  `, [fromSector]);

  res.json(result.rows[0] || {});
});

app.listen(3000, () => {
  console.log("🌐 API rodando na porta 3000");
});
// ----------------------
// INJEÇÃO DE FALHAS
// ----------------------

let forcedFailures = {};

// Ex: POST /api/v1/fault
app.post("/api/v1/fault", (req, res) => {
  const { spotId, type } = req.body;

  if (!spotId || !type) {
    return res.status(400).json({ error: "spotId e type são obrigatórios" });
  }

  forcedFailures[spotId] = type;

  console.log(`⚠️ Falha ativada: ${type} em ${spotId}`);

  res.json({ status: "ok", spotId, type });
});
app.post("/api/v1/reset", async (req, res) => {
  try {
    // limpar estados das vagas
    await db.query(`
      UPDATE spots
      SET currentState = 'FREE',
          lastChangeTs = NULL,
          lastEventId = NULL
    `);

    // limpar histórico
    await db.query(`DELETE FROM spot_events`);

    // limpar incidentes
    await db.query(`DELETE FROM incidents`);

    // limpar recomendações
    await db.query(`DELETE FROM recommendations_log`);

    console.log("🔄 Sistema resetado");

    res.json({ status: "resetado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao resetar" });
  }
});