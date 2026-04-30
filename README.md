# Estacionamento_Inteligente

<<<<<<< HEAD
=======
Teste de falhas:
 

 curl -X POST http://localhost:3000/api/v1/fault \
-H "Content-Type: application/json" \
-d '{"spotId":"A-01","type":"flapping"}'

curl -X POST http://localhost:3000/api/v1/fault \
-H "Content-Type: application/json" \
-d '{"spotId":"A-02","type":"stuck_occupied"}'

curl -X POST http://localhost:3000/api/v1/fault \
-H "Content-Type: application/json" \
-d '{"spotId":"A-03","type":"stuck_free"}'

Verificar no sistema: curl http://localhost:3000/api/v1/incidents

Resetar Gráfico: curl -X POST http://localhost:3000/api/v1/reset
>>>>>>> a7ae644 (Entrega)
