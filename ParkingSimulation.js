const Sensor = require('./Sensor');
      for (let i = 1; i <= 30; i++) {
        const id = `${sector}-${String(i).padStart(2, '0')}`;
        this.sensors.push(new Sensor(id, sector));
      }
    });
  }

  createGateways() {
    this.sectors.forEach((sector) => {
      this.gateways.push(new Gateway(sector));
    });
  }

  getPeakFactor() {
    const hour = new Date().getHours();

    const morningPeak = hour >= 7 && hour <= 10;
    const eveningPeak = hour >= 17 && hour <= 20;

    return (morningPeak || eveningPeak) ? 0.7 : 0.3;
  }

  simulate() {
    const peakFactor = this.getPeakFactor();

    this.sensors.forEach(sensor => {
      sensor.simulate(peakFactor);
    });

    this.printDashboard();
  }

  printDashboard() {
    console.clear();
    console.log('=== SIMULADOR DE ESTACIONAMENTO ===\n');

    this.gateways.forEach(gateway => {
      const summary = gateway.getSectorSummary(this.sensors);

      console.log(
        `Setor ${summary.sector} -> ` +
        `Ocupadas: ${summary.occupied} | ` +
        `Livres: ${summary.free}`
      );
    });
  }

  getAllSensors() {
    return this.sensors;
  }

  applyFailure(spotId, failureType) {
    const sensor = this.sensors.find(item => item.id === spotId);

    if (!sensor) return null;

    sensor.setFailureMode(failureType);
    return sensor;
  }
}

module.exports = ParkingSimulation;
