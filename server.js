const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ✅ Servir imagens estáticas da pasta /public/imagens
app.use('/imagens', express.static(path.resolve(__dirname, 'public', 'imagens')));


const fs = require('fs');


// 🔍 Rota para buscar produtos com filtros opcionais
app.get('/produtos', async (req, res) => {
  const { categoria, busca, destaque } = req.query;

  let sql = 'SELECT * FROM produtos WHERE 1=1';
  const params = [];

  if (categoria) {
    sql += ' AND categoria = ?';
    params.push(categoria);
  }

  if (destaque === 'true') {
    sql += ' AND destaque = true';
  }

  if (busca) {
    sql += ' AND (titulo LIKE ? OR descricao LIKE ? OR codigo LIKE ?)';
    const termo = `%${busca}%`;
    params.push(termo, termo, termo);
  }

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar produtos' });
  }
});

// Rota para obter o próximo código disponível
app.get('/proximo-codigo', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT MAX(CAST(codigo AS UNSIGNED)) AS ultimoCodigo FROM produtos`);
    const proximoCodigo = (rows[0].ultimoCodigo || 0) + 1;
    const codigoFormatado = String(proximoCodigo).padStart(3, '0'); // Ex: 004

    res.json({ proximoCodigo: codigoFormatado });
  } catch (err) {
    console.error('Erro ao gerar código:', err);
    res.status(500).json({ erro: 'Erro ao buscar próximo código' });
  }
});

// POST - criar produto
app.post('/produtos', async (req, res) => {
  const { titulo, descricao, categoria, url, img, destaque } = req.body;

  try {
    // Buscar o maior código atual e gerar o próximo
    const [rows] = await pool.query(`SELECT MAX(CAST(codigo AS UNSIGNED)) AS ultimoCodigo FROM produtos`);
    const proximoCodigo = (rows[0].ultimoCodigo || 0) + 1;
    const codigoFormatado = String(proximoCodigo).padStart(3, '0'); // ex: 004, 015

    const sql = `
      INSERT INTO produtos (codigo, titulo, descricao, categoria, url, img, destaque)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      codigoFormatado,
      titulo,
      descricao,
      categoria,
      url,
      img,
      destaque ? 1 : 0,
    ];

    await pool.query(sql, params);

    res.status(201).json({ mensagem: 'Produto criado com sucesso', codigo: codigoFormatado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});


// PUT - atualizar produto
app.put('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { codigo, titulo, descricao, categoria, url, img, destaque } = req.body;

  try {
    const sql = `
      UPDATE produtos
      SET codigo = ?, titulo = ?, descricao = ?, categoria = ?, url = ?, img = ?, destaque = ?
      WHERE id = ?
    `;
    const params = [codigo, titulo, descricao, categoria, url, img, destaque ? 1 : 0, id];
    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({ mensagem: 'Produto atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// DELETE - excluir produto
app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `DELETE FROM produtos WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({ mensagem: 'Produto excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir produto' });
  }
});

app.listen(port, () => {
  console.log(`✅ API rodando em http://localhost:${port}`);  
});
