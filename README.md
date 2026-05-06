# Estacionamento_Inteligente

Estrutura do MVP

O sistema será composto por quatro principais camadas:

1. Sensores IoT Simulados

Cada vaga possuirá um sensor virtual responsável por informar seu estado atual, podendo assumir dois status:

FREE (vaga livre)
OCCUPIED (vaga ocupada)

Esses sensores serão simulados em Node.js e representarão o comportamento real de entrada e saída de veículos.

O sistema considerará:

horários de pico (manhã e final da tarde)
tempo variável de permanência dos veículos
falhas simuladas para testes operacionais
2. Comunicação em Tempo Real com MQTT

A comunicação entre sensores e gateways será realizada utilizando o protocolo MQTT, responsável pelo envio de eventos em tempo real.

Cada setor possuirá um gateway responsável por receber os dados dos sensores daquele setor e encaminhá-los ao sistema principal.

Exemplo de evento enviado:

{

  "eventId": "uuid",

  "ts": "2026-04-29T10:15:30.000Z",

  "sectorId": "A",

  "spotId": "A-07",

  "state": "OCCUPIED",

  "source": "sensor|gateway"

}

O uso do MQTT permite baixa latência, leveza na comunicação e maior aderência a ambientes IoT.

3. API REST (HTTP)

Será disponibilizada uma API REST para consultas operacionais, relatórios e administração do sistema.

Principais funcionalidades:

consultar status atual das vagas
consultar vagas livres por setor
consultar histórico de ocupação
aplicar falhas simuladas nos sensores
gerar relatórios básicos de uso

Exemplos de endpoints:

GET /spots
GET /sector/A
GET /history
POST /failure

Essa camada será desenvolvida utilizando Node.js com Express.

4. Banco de Dados para Histórico e Relatórios

O banco de dados será responsável por armazenar:

status atual das vagas
histórico de ocupação
eventos recebidos via MQTT
falhas aplicadas nos sensores
dados para geração de relatórios

Será utilizado um banco relacional (MySQL), permitindo maior controle, organização e facilidade na construção de relatórios acadêmicos.

Exemplo de informações armazenadas:

horário de entrada
horário de saída
tempo médio de permanência
taxa de ocupação por setor
sensores com maior incidência de falhas
Funcionalidades Mínimas do MVP

O MVP deverá obrigatoriamente permitir:

Monitoramento em tempo real

Visualização do estado atual das 90 vagas.

Simulação de ocupação automática

Alteração dinâmica entre FREE e OCCUPIED.

Injeção de falhas

Simulação de problemas reais de sensores:

stuck_occupied
stuck_free
flapping
Histórico persistente

Registro completo no banco de dados.

Relatórios básicos

Consulta da ocupação por setor e análise simples de uso.

Fora do Escopo Inicial

A utilização de Inteligência Artificial está prevista para uma etapa futura do projeto, não fazendo parte deste MVP inicial.

Posteriormente, a IA poderá ser utilizada para:

previsão de ocupação futura
detecção automática de falhas
recomendação de vagas disponíveis
análise preditiva de fluxo de veículos
Resultado Esperado

Ao final do MVP, o sistema deverá ser capaz de representar de forma funcional e didática um estacionamento inteligente baseado em IoT, permitindo simulação, monitoramento, persistência de dados e análise operacional.

Esse MVP servirá como base sólida para futuras expansões, incluindo dashboard avançado, integração com aplicativos móveis e módulos de inteligência artificial.
