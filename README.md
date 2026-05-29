# Arbitralis Lexi — Webhook Assíncrono (PoC)

PoC de desacoplamento entre recebimento e processamento de mensagens do agente de negociação **Lexi** (Arbitralis) via WhatsApp, eliminando timeouts da Meta causados por respostas síncronas ao LLM.

---

## Stack

| Ferramenta | Papel |
|---|---|
| Node.js 22 + TypeScript | Runtime e linguagem |
| Fastify 5 | Framework HTTP |
| Zod | Validação de schema + tipos inferidos (`z.infer`) |
| Pino | Logging estruturado (sem `console.log`) |
| Vitest | Testes unitários e de integração |
| Biome | Linting e formatação |

---

## Como instalar e rodar

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
```

**.env**
```
PORT=3000
NODE_ENV=development
WHATSAPP_MOCK_URL=http://localhost:3000/api
```

> `WHATSAPP_MOCK_URL` aponta para a própria instância local — o endpoint `/api/send-message` simula a API do WhatsApp.

```bash
# Rodar em modo desenvolvimento (hot reload)
npm run dev

# Rodar build de produção
npm run build && npm start
```

---

## Testes

```bash
# Todos os testes
npm test

# Apenas unitários (rápido, sem I/O real)
npm run test:unit

# Apenas integração (usa fastify.inject, sem porta real)
npm run test:integration

# Watch mode
npm run test:watch

# Cobertura
npm run test:coverage
```

---

## Endpoints

### `POST /api/webhook`

Recebe a mensagem do WhatsApp. Responde **202** imediatamente e enfileira o processamento.

**Payload:**
```json
{
  "messageId": "clh1a2b3c4d5e6f7g8h9i0j1k",
  "from": "5511999990000",
  "body": "Quero negociar minha dívida"
}
```

| Campo | Tipo | Validação |
|---|---|---|
| `messageId` | string | cuid2 |
| `from` | string | número WhatsApp |
| `body` | string | texto da mensagem |

**Resposta 202:**
```json
{ "received": true, "messageId": "clh1a2b3c4d5e6f7g8h9i0j1k" }
```

**Resposta 400 (payload inválido):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid payload",
  "details": [{ "field": "messageId", "message": "Invalid cuid2" }]
}
```

---

### `POST /api/send-message`

Simula a API do WhatsApp (outbound). Chamado internamente pelo worker após o LLM processar a mensagem.

```json
{
  "to": "5511999990000",
  "text": "Resposta simulada para: \"Quero negociar minha dívida\"",
  "correlationId": "clh1a2b3c4d5e6f7g8h9i0j1k"
}
```

---

### `GET /api/health`

Expõe estatísticas do worker em tempo real.

```json
{ "queueSize": 0, "processed": 42, "failed": 3 }
```

---

## Diagrama do fluxo

```
WhatsApp (Meta)
      │
      │  POST /api/webhook
      ▼
┌─────────────────┐
│  Fastify        │  ← responde 202 imediatamente
│  webhook route  │
└────────┬────────┘
         │ enqueue(job)
         ▼
┌─────────────────┐
│  MemoryQueue    │  ← EventEmitter em memória
│  (FIFO)         │
└────────┬────────┘
         │ evento 'job'
         ▼
┌─────────────────┐
│  LLMWorker      │  ← consome job, retry com back-off exponencial
│  (processNext)  │    tentativa 1 → 2 → 4 segundos de espera
└────────┬────────┘
         │ call(body)
         ▼
┌─────────────────┐
│  LLMService     │  ← simula delay 2–8s, falha 20% das vezes
│  (simulado)     │
└────────┬────────┘
         │ send(outboundMessage)
         ▼
┌─────────────────┐
│  WhatsAppService│  ← POST para /api/send-message, timeout 5s
│  (outbound)     │
└─────────────────┘
         │
         ▼
POST /api/send-message  →  "API do WhatsApp" (mock local)
```

**Retry com back-off exponencial:**
```
tentativa 1 → falha → aguarda 1s
tentativa 2 → falha → aguarda 2s
tentativa 3 → falha → descarta job (logged como error)
```

**PII:** o campo `from` é mascarado nos logs (`551199****0000`). O `body` nunca é logado.

---

## ADR — Fila em memória vs. Redis + BullMQ

### Contexto

A PoC precisa desacoplar recebimento de processamento sem dependências externas, para facilitar execução local e avaliação do design.

### Decisão

Usar `MemoryQueue extends EventEmitter` com array tipado. Sem banco de dados, sem broker externo.

### Consequências desta escolha

| Aspecto | MemoryQueue (PoC) | Redis + BullMQ (produção) |
|---|---|---|
| Setup | Zero — só `npm install` | Redis + configuração de conexão |
| Persistência | Nenhuma — reiniciar o processo perde a fila | Jobs sobrevivem a crashes e restarts |
| Escala horizontal | Impossível — estado local por instância | Múltiplos workers consomem a mesma fila |
| Visibilidade | Apenas via `/api/health` | Dashboard BullMQ Board, métricas, alertas |
| DLQ | Não existe | Jobs falhados vão para Dead Letter Queue, reprocessáveis |
| Rate limiting | Manual | Nativo no BullMQ (concurrency, rate limiter) |

### Caminho de migração

1. Substituir `MemoryQueue` por `Queue` do BullMQ — interface `enqueue`/`dequeue` se mapeia para `queue.add`/`worker.process`
2. `LLMWorker` vira um `Worker` do BullMQ — `processWithRetry` se torna o `processor`, o retry e back-off são configurados nativamente
3. Jobs falhados após `MAX_ATTEMPTS` são movidos automaticamente para a DLQ; reprocessamento via `queue.retryJobs()`
4. Adicionar Redis Sentinel ou Cluster para alta disponibilidade

---

## O que foi deixado de fora (escopo da PoC)

| Funcionalidade | Por que ficou fora | Como seria em produção |
|---|---|---|
| **Autenticação do webhook** | Aumentaria complexidade sem agregar ao design assíncrono | Verificar assinatura HMAC-SHA256 do header `X-Hub-Signature-256` da Meta |
| **Idempotência** | Sem banco, não há como deduplicar `messageId` | Redis SET com TTL ou tabela de `processed_ids` no banco |
| **Persistência do estado da negociação** | Estado da conversa seria por sessão de `from` | Redis Hash por `from`, ou tabela `negotiations` no banco com máquina de estados |
| **Autenticação outbound** | Mock local não exige token | Bearer token da API oficial do WhatsApp Business no header `Authorization` |
| **Métricas e observabilidade** | Pino já estrutura logs | OpenTelemetry traces + Prometheus metrics + Grafana |
| **Graceful drain** | Worker para imediatamente no SIGTERM | Aguardar jobs em andamento completarem antes de encerrar |

---

> This is a challenge by [Coodesh](https://coodesh.com/)
