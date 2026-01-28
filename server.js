import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 80;
app.use(express.json());

// Essas duas linhas são necessárias para usar __dirname com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos da pasta dist (apenas se existir)
const distPath = path.join(__dirname, './dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Configurações do Facebook
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_PIXEL_ID = process.env.FB_PIXEL_ID;

// Função auxiliar para hash SHA256
function hashData(data) {
  if (!data) return null;
  // Normalizar: remover espaços, converter para minúsculas
  const normalized = String(data).trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Endpoint para receber eventos do frontend e enviar para Facebook CAPI
app.post('/api/fb-events', async (req, res) => {
  try {
    const { eventName, eventId, eventSourceUrl, userData, customData, actionSource } = req.body;

    if (!FB_ACCESS_TOKEN || !FB_PIXEL_ID) {
      console.error('Facebook credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Preparar dados do usuário com hash quando necessário
    const formattedUserData = {
      ...userData,
    };

    // Tratamento específico para em e ph (suporte a múltiplos valores - array de hashes)
    ['em', 'ph'].forEach(field => {
        if (formattedUserData[field]) {
             formattedUserData[field] = Array.isArray(formattedUserData[field])
                ? formattedUserData[field].map(hashData)
                : [hashData(formattedUserData[field])];
        }
    });

    // Tratamento para outros campos PII (fn, ln, country, etc) - espera string hashada única
    ['fn', 'ln', 'ct', 'st', 'zp', 'country', 'ge', 'db'].forEach(field => {
        if (formattedUserData[field]) {
            if (Array.isArray(formattedUserData[field])) {
                 formattedUserData[field] = hashData(formattedUserData[field][0]);
            } else {
                 formattedUserData[field] = hashData(formattedUserData[field]);
            }
        }
    });

    // Adicionar IP e User Agent se não vierem do front (mas idealmente o front captura ou pegamos do request)
    if (!formattedUserData.client_ip_address) {
        // Tentar pegar IP do request (pode precisar de ajuste se estiver atrás de proxy/Cloudflare)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (ip) formattedUserData.client_ip_address = ip.split(',')[0].trim();
    }
    
    if (!formattedUserData.client_user_agent) {
        formattedUserData.client_user_agent = req.headers['user-agent'];
    }
    
    // Remover campos undefined/null
    Object.keys(formattedUserData).forEach(key => {
        if (formattedUserData[key] === undefined || formattedUserData[key] === null) {
            delete formattedUserData[key];
        }
    });

    const eventPayload = {
      data: [
        {
          event_name: eventName,
          event_time: currentTimestamp,
          event_id: eventId,
          event_source_url: eventSourceUrl,
          action_source: actionSource || 'website',
          user_data: formattedUserData,
          custom_data: customData,
        },
      ],
      access_token: FB_ACCESS_TOKEN,
    };

    // Enviar para Graph API
    // Usando fetch nativo (Node 18+) com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${FB_PIXEL_ID}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          console.error('Facebook CAPI Error:', JSON.stringify(data, null, 2));
          return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('Facebook CAPI Timeout: Request took longer than 10s');
            return res.status(504).json({ error: 'Gateway Timeout - Facebook API' });
        }
        throw error; // Repassa para o catch externo
    }
  } catch (error) {
    console.error('Error sending event to Facebook:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Rota para raiz e catch-all compatível com path-to-regexp v7+
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`qualifica.sarahfiorot.adv.br rodando em http://localhost:${PORT}`);
});
