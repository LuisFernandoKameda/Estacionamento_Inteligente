const STATUS = Object.freeze({
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED'
});

const FAILURE_TYPES = Object.freeze({
  NONE: null,
  STUCK_OCCUPIED: 'stuck_occupied',
  STUCK_FREE: 'stuck_free',
  FLAPPING: 'flapping'
});

const PORT = 3000;
const SIMULATION_INTERVAL = 1000;

module.exports = {
  STATUS,
  FAILURE_TYPES,
  PORT,
  SIMULATION_INTERVAL
};
