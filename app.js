const express = require('express');
const app = express();

const {
  PORT,
  SIMULATION_INTERVAL
} = require('./config/constants');

const ParkingSimulation = require('./models/ParkingSimulation');
const parkingRoutes = require('./routes/parkingRoutes');

app.use(express.json());

const simulation = new ParkingSimulation();

app.use('/', parkingRoutes(simulation));

setInterval(() => {
  simulation.simulate();
}, SIMULATION_INTERVAL);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
