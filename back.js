
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  client.subscribe("campus/parking/sectors/+/spots/+/events");
});

client.on("message", async (topic, message) => {
  const event = JSON.parse(message.toString());

  // 1. idempotência
  const exists = await db.query(
    "SELECT 1 FROM spot_events WHERE eventId = $1",
    [event.eventId]
  );

  if (exists.rowCount > 0) return;

  // 2. salvar histórico
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

  // 3. atualizar estado atual
  await db.query(`
    UPDATE spots
    SET currentState=$1, lastChangeTs=$2, lastEventId=$3
    WHERE spotId=$4
  `, [event.state, event.ts, event.eventId, event.spotId]);
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

  // 👇 AQUI entra sua regra
  let lastRecommendation = {};
    const now = Date.now();
    const lastTime = lastRecommendation[event.sectorId] || 0;

// só gera recomendação a cada 30 segundos
    if (occupancyRate >= 0.9 && (now - lastTime > 30000)) {

      lastRecommendation[event.sectorId] = now;
        // buscar melhor setor
        const best = await db.query(`
          SELECT sectorId,
            COUNT(*) FILTER (WHERE currentState='FREE') as free
          FROM spots
          WHERE sectorId != $1
          GROUP BY sectorId
          ORDER BY free DESC
          LIMIT 1
        `);

    const recommended = best.rows[0];

    const response = {
      fromSector: event.sectorId,
      recommendedSector: recommended.sectorId,
      reason: `Sector ${event.sectorId} at ${(occupancyRate*100).toFixed(0)}% occupancy; Sector ${recommended.sectorId} has ${recommended.free} free spots`,
      ts: new Date().toISOString()
    };

    console.log("👉 RECOMENDAÇÃO:", response);

    // salvar no banco
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