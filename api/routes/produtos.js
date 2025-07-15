const express = require("express");
const router = express.Router();
const pool = require('../../db');

// Buscar todos os produtos com filtros
router.get("/", async (req, res) => {
  const { categoria, busca, destaque } = req.query;
  let sql = "SELECT * FROM produtos WHERE 1=1";
  const params = [];

  if (categoria) {
    sql += " AND categoria = ?";
    params.push(categoria);
  }

  if (destaque === "true") {
    sql += " AND destaque = true";
  }

  if (busca) {
    sql += " AND (codigo = ? OR titulo LIKE ? OR descricao LIKE ?)";
    params.push(busca, `%${busca}%`, `%${busca}%`);
  }

  try {
    const [rows] = await pool.query(sql, params);
    console.log(`Query executada, retornou ${rows.length} itens.`);

    const BACKEND_URL = "https://backend-meus-links.vercel.app";

    const produtosAjustados = rows.map(produto => {
      let imgUrl = produto.img || "";

      if (imgUrl.startsWith("http://localhost:3001")) {
        imgUrl = imgUrl.replace("http://localhost:3001", BACKEND_URL);
      } else if (imgUrl.startsWith("/imagens")) {
        imgUrl = BACKEND_URL + imgUrl;
      }

      return {
        ...produto,
        img: imgUrl,
      };
    });

    res.json(produtosAjustados);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    res.status(500).json({ erro: "Erro interno ao buscar produtos" });
  }
});

// Buscar produto por código
router.get("/codigo/:codigo", async (req, res) => {
  const { codigo } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM produtos WHERE codigo = ? LIMIT 1",
      [codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const BACKEND_URL = "https://backend-meus-links.vercel.app";
    const produto = rows[0];
    let imgUrl = produto.img || "";

    if (imgUrl.startsWith("http://localhost:3001")) {
      imgUrl = imgUrl.replace("http://localhost:3001", BACKEND_URL);
    } else if (imgUrl.startsWith("/imagens")) {
      imgUrl = BACKEND_URL + imgUrl;
    }

    produto.img = imgUrl;

    res.json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Gerar próximo código automático
router.get("/proximo-codigo", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT MAX(CAST(codigo AS UNSIGNED)) AS ultimoCodigo FROM produtos`
    );
    const proximoCodigo = (rows[0].ultimoCodigo || 0) + 1;
    const codigoFormatado = String(proximoCodigo).padStart(3, "0");
    res.json({ proximoCodigo: codigoFormatado });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar próximo código" });
  }
});

// Criar novo produto
router.post("/", async (req, res) => {
  const { titulo, descricao, categoria, url, img, destaque } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT MAX(CAST(codigo AS UNSIGNED)) AS ultimoCodigo FROM produtos`
    );
    const proximoCodigo = (rows[0].ultimoCodigo || 0) + 1;
    const codigoFormatado = String(proximoCodigo).padStart(3, "0");

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

    res.status(201).json({
      mensagem: "Produto criado com sucesso",
      codigo: codigoFormatado,
    });
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    res.status(500).json({ erro: "Erro ao criar produto" });
  }
});

// Atualizar produto existente
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { codigo, titulo, descricao, categoria, url, img, destaque } = req.body;

  try {
    const sql = `
      UPDATE produtos
      SET codigo = ?, titulo = ?, descricao = ?, categoria = ?, url = ?, img = ?, destaque = ?
      WHERE id = ?
    `;
    const params = [
      codigo,
      titulo,
      descricao,
      categoria,
      url,
      img,
      destaque ? 1 : 0,
      id,
    ];
    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    res.json({ mensagem: "Produto atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res.status(500).json({ erro: "Erro ao atualizar produto" });
  }
});

// Deletar produto
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `DELETE FROM produtos WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json({ mensagem: 'Produto excluído com sucesso' });
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    res.status(500).json({ erro: 'Erro ao excluir produto' });
  }
});

module.exports = router;
