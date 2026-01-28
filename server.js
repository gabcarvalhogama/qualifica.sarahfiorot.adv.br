import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 80;
app.use(express.json());

// Essas duas linhas são necessárias para usar __dirname com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos da pasta dist
app.use(express.static(path.join(__dirname, './dist')));

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