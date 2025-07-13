const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require('path');


const produtosRoutes = require("./routes/produtos");

dotenv.config();

const app = express();

// Defina uma lista de origens permitidas
const allowedOrigins = [  
  "https://www.queroesseachadobr.com.br",
  "http://localhost:5174",
];

app.use('/imagens', express.static(path.resolve(__dirname, '../public/imagens')));

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem origem (como chamadas via curl ou testes locais que não definam origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        return callback(new Error("Origin not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Rotas

app.use("/produtos", produtosRoutes);



module.exports = app;
