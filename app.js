// Importa el módulo de Express
const express = require("express");
// Crea una instancia de Express
const app = express();
// Puerto en el que se ejecutará el servidor
const port = 3000;
// Importa el módulo de CORS
const cors = require('cors');
// Importa el módulo de MySQL
const mysql = require('mysql2/promise');
// Importa el módulo de sesiones
const session = require('express-session');
// Importa el módulo de cifrado MD5
const md5 = require('md5');

// Middleware para analizar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: "12345",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

// Crea la conexión a la base de datos.
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'login',
});

app.get("/", (req, res) => {
  res.send("Inicio");
});

// Ruta para iniciar sesión
app.get("/login", async (req, res) => {
  const datos = req.query;
  try {
    const [results, fields] = await connection.query(
      "SELECT * FROM `usuarios` WHERE `usuario` = ? AND `clave` = ?",
      [datos.usuario, md5(datos.clave)]
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

// Valida si el usuario está autenticado
app.get("/validar", (req, res) => {
  if (req.session.usuario) {
    res.status(200).json({ usuario: req.session.usuario });
  } else {
    res.status(401).send("Sesion no validada");
  }
});

// Ruta para cerrar sesión
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error al cerrar sesión");
    }
    res.status(200).send("Sesión cerrada correctamente");
  });
});

// Ruta para registrar un nuevo usuario
app.get("/registro", async (req, res) => {
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

    // Cifra la contraseña antes de almacenarla
    const hashedPassword = md5(datos.clave);

    // Inserta el nuevo usuario en la base de datos
    const [results] = await connection.query(
      "INSERT INTO `usuarios` (`usuario`, `clave`, `nombre`, `apellido`, `telefono`, `direccion`, `fecha_nacimiento`) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [datos.usuario, hashedPassword, datos.nombre, datos.apellido, datos.telefono, datos.direccion, datos.fecha_nacimiento]
    );
    // Verifica si se insertó el usuario
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
// Inicia el servidor en el puerto 3000
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// Ruta para obtener los productos
app.get("/productos", async (req, res) => {
  try {
    const [results] = await connection.query("SELECT * FROM `productos`");
    res.status(200).json(results);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error al obtener los productos");
  }
});

// Ruta para obtener un producto por su ID
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

// Ruta para agregar un producto
app.post("/productos", async (req, res) => {
  if (!req.session.usuario) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const { nombre, precio, caracteristicas, imagen } = req.body;

  try {
    const [results] = await connection.query(
      "INSERT INTO `productos` (`nombre`, `precio`, `caracteristicas`, `imagen`) VALUES (?, ?, ?, ?)",
      [nombre, precio, caracteristicas, imagen]
    );

    if (results.affectedRows > 0) {
      const [producto] = await connection.query("SELECT * FROM `productos` WHERE `id` = ?", [results.insertId]);
      res.status(200).json(producto[0]);
    } else {
      res.status(500).send("Error al agregar el producto");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error en el servidor");
  }
});