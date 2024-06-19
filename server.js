const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect('mongodb://localhost:27017/dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch((error) => {
  console.error('Erro ao conectar ao MongoDB:', error);
});


// Modelo de dados
const DadosSchema = new mongoose.Schema({
  area: String,
  dados: Array,
});
const Dados = mongoose.model('Dados', DadosSchema, 'dashboard'); // Especifica a coleção 'suaColecao'

// Rota para buscar dados de uma área específica
app.get('/dados/:area', async (req, res) => {
  try {
    const area = req.params.area;
    const dados = await Dados.findOne({ area });
    if (dados) {
      res.json(dados.dados);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ message: 'Erro ao buscar dados' });
  }
});

// Rota para salvar dados de uma área específica
app.post('/dados/:area', async (req, res) => {
  try {
    const area = req.params.area;
    const novosDados = req.body.dados;
    let dados = await Dados.findOne({ area });
    if (dados) {
      dados.dados = [...dados.dados, ...novosDados];
    } else {
      dados = new Dados({ area, dados: novosDados });
    }
    await dados.save();
    res.json(dados.dados);
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    res.status(500).json({ message: 'Erro ao salvar dados' });
  }
});

// Rota para excluir dados de uma área específica
app.delete('/dados/:area', async (req, res) => {
  try {
    const area = req.params.area;
    await Dados.deleteOne({ area });
    res.json({ message: 'Dados excluídos' });
  } catch (error) {
    console.error('Erro ao excluir dados:', error);
    res.status(500).json({ message: 'Erro ao excluir dados' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
