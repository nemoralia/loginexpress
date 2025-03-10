const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors');
const mysql = require('mysql2/promise');
const session = require('express-session');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: "12345",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Asegúrate de que secure esté en false para desarrollo
}));

// Create the connection to database
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'login',
});

app.get("/", (req, res) => {
  res.send("Inicio");
});

app.get("/login", async (req, res) => {
  const datos = req.query;
  try {
    const [results, fields] = await connection.query(
      "SELECT * FROM `usuarios` WHERE `usuario` = ? AND `clave` = ?",
      [datos.usuario, datos.clave]
    );
    if (results.length > 0) {
      req.session.usuario = datos.usuario;
      res.status(200).send("Inicio sesión correcto");
    } else {
      res.status(401).send("Inicio sesión incorrecto");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/validar", (req, res) => {
  if (req.session.usuario) {
    res.status(200).json({ usuario: req.session.usuario });
  } else {
    res.status(401).send("Sesion no validada");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error al cerrar sesión");
    }
    res.status(200).send("Sesión cerrada correctamente");
  });
});

app.get("/registro", async (req, res) => {
  if (!req.session.usuario) {
    res.status(401).json({ error: "No autorizado" });
    return;
  } 

  const datos = req.query;
  try {
    // Verifica si el usuario ya existe
    const [existingUser] = await connection.query(
      "SELECT * FROM `usuarios` WHERE `usuario` = ?",
      [datos.usuario]
    );

    if (existingUser.length > 0) {
      return res.status(409).send("El usuario ya existe");
    }

    // Inserta el nuevo usuario en la base de datos
    const [results] = await connection.query(
      "INSERT INTO `usuarios` (`usuario`, `clave`, `nombre`, `apellido`, `telefono`, `direccion`, `fecha_nacimiento`) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [datos.usuario, datos.clave, datos.nombre, datos.apellido, datos.telefono, datos.direccion, datos.fecha_nacimiento]
    );

    if (results.affectedRows > 0) {
      req.session.usuario = datos.usuario;
      res.status(200).send("Registro exitoso");
    } else {
      res.status(500).send("Error en el registro");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error en el servidor");
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/productos", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM `productos`");
    res.status(200).json(results);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error al obtener los productos");
  }
});

app.get("/productos", async (req, res) => {

  try {
    const [results , fields] = await connection.query(
      "SELECT * FROM `productos`",
    );

  res.status(200).json(results);

  console.log(results);
  console.log(fields);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error al obtener los productos");
  }
});

app.delete("/productos", async (req, res) => {
  if (!req.session.usuario) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const datos = req.query;

  try {
    const [results] = await connection.query(
      "DELETE FROM `productos` WHERE `id` = ?",
      [datos.id]
    );

    if (results.affectedRows > 0) {
      res.status(200).send("Producto eliminado");
    } else {
      res.status(404).send("Producto no encontrado");
    }
    console.log(results);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error al eliminar el producto");
  }
});