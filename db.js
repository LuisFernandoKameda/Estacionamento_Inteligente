const Database = require("better-sqlite3");

// cria o arquivo automaticamente
const db = new Database("parking.db");

module.exports = db;

db.exec(`
CREATE TABLE IF NOT EXISTS spots (
  spotId TEXT PRIMARY KEY,
  sectorId TEXT,
  currentState TEXT,
  lastChangeTs TEXT,
  lastEventId TEXT
);

CREATE TABLE IF NOT EXISTS spot_events (
  eventId TEXT PRIMARY KEY,
  ts TEXT,
  sectorId TEXT,
  spotId TEXT,
  state TEXT,
  rawPayloadJson TEXT
);

CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsOpen TEXT,
  tsClose TEXT,
  type TEXT,
  severity TEXT,
  sectorId TEXT,
  spotId TEXT,
  evidenceJson TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS recommendations_log (
  ts TEXT,
  fromSector TEXT,
  recommendedSector TEXT,
  reason TEXT,
  dataJson TEXT
);
`);

const sectors = ["A", "B", "C"];

sectors.forEach(sector => {
  for (let i = 1; i <= 30; i++) {
    const spotId = `${sector}-${String(i).padStart(2, "0")}`;

    db.prepare(`
      INSERT OR IGNORE INTO spots (spotId, sectorId, currentState)
      VALUES (?, ?, 'FREE')
    `).run(spotId, sector);
  }
});



const rows = db.prepare("SELECT * FROM spots").all();

console.log(rows);