const express = require('express');
const router = express.Router();

const { FAILURE_TYPES } = require('../config/constants');

module.exports = (simulation) => {
  router.get('/spots', (req, res) => {
    res.json(simulation.getAllSensors());
  });

  router.post('/failure', (req, res) => {
    const { spotId, failureType } = req.body;

    if (!Object.values(FAILURE_TYPES).includes(failureType)) {
      return res.status(400).json({
        message: 'Tipo de falha inválido.'
      });
    }

    const sensor = simulation.applyFailure(spotId, failureType);

    if (!sensor) {
      return res.status(404).json({
        message: 'Vaga não encontrada.'
      });
    }

    return res.json({
      message: 'Falha aplicada com sucesso.',
      sensor
    });
  });

  return router;
};
