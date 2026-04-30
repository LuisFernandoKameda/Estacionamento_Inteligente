const { STATUS, FAILURE_TYPES } = require('../config/constants');

class Sensor {
  constructor(id, sector) {
    this.id = id;
    this.sector = sector;
    this.status = Math.random() > 0.5 ? STATUS.FREE : STATUS.OCCUPIED;
    this.failureMode = FAILURE_TYPES.NONE;
    this.occupiedTimeRemaining = this.generateOccupationTime();
  }

  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateOccupationTime() {
    return this.randomBetween(30, 360);
  }

  applyFailureMode() {
    switch (this.failureMode) {
      case FAILURE_TYPES.STUCK_OCCUPIED:
        this.status = STATUS.OCCUPIED;
        return true;

      case FAILURE_TYPES.STUCK_FREE:
        this.status = STATUS.FREE;
        return true;

      case FAILURE_TYPES.FLAPPING:
        this.status = Math.random() > 0.5
          ? STATUS.FREE
          : STATUS.OCCUPIED;
        return true;

      default:
        return false;
    }
  }

  simulate(peakFactor) {
    if (this.applyFailureMode()) return;

    if (this.status === STATUS.OCCUPIED) {
      this.occupiedTimeRemaining--;

      if (this.occupiedTimeRemaining <= 0) {
        this.status = STATUS.FREE;
      }

      return;
    }

    if (Math.random() < peakFactor) {
      this.status = STATUS.OCCUPIED;
      this.occupiedTimeRemaining = this.generateOccupationTime();
    }
  }

  setFailureMode(failureType) {
    this.failureMode = failureType;
  }
}

module.exports = Sensor;
