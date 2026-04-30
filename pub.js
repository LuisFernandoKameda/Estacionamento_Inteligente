import mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883", {
  will: {
    topic: 'temperatura/s',
    payload: 'offline',
    qos: 0,
    retain: true
  }
});
