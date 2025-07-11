const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const usuariosRoutes = require("./routes/usuarios");
const produtosRoutes = require("./routes/produtos");
const enderecosRoutes = require("./routes/enderecos");

dotenv.config();

const app = express();

// CORS configurado com credentials
app.use(cors({
  origin: "http://localhost:5173", // frontend
  credentials: true,               // ⬅️ permite envio de cookies
}));

app.use(cookieParser()); // ⬅️ importante para ler cookies
app.use(express.json());

// Rotas
app.use("/usuarios", usuariosRoutes);
app.use("/login", usuariosRoutes);
app.use("/produtos", produtosRoutes);
app.use("/produtos-categorias", produtosRoutes);
app.use("/produtos-id", produtosRoutes);
app.use("/enderecos", enderecosRoutes);
app.use("/enderecos-id", enderecosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});