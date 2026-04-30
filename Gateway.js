const { STATUS } = require('../config/constants');

class Gateway {
  constructor(sector) {
    this.sector = sector;
  }

  getSectorSummary(sensors) {
    const sectorSensors = sensors.filter(
      sensor => sensor.sector === this.sector
    );

    const occupied = sectorSensors.filter(
      sensor => sensor.status === STATUS.OCCUPIED
    ).length;

    const free = sectorSensors.filter(
      sensor => sensor.status === STATUS.FREE
    ).length;

    return {
      sector: this.sector,
      occupied,
      free
    };
  }
}

module.exports = Gateway;
