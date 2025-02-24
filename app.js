const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors')
const mysql = require('mysql2/promise');
const session = require('express-session');

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(session({
    secret: "12345"
}))


// Create the connection to database
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'login',
});

app.get("/", (req, res) => {
  res.send("Inicio");
});


app.get("/login",async (req, res) => {
    const datos = req.query;
    // A simple SELECT query
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
    
    console.log(results); // results contains rows returned by server
    console.log(fields); // fields contains extra meta data about results, if available
  } catch (err) {
    console.log(err);
  }
});


app.get("/validar", (req, res) => {
    if(req.session.usuario){
        res.status(200).send("Sesion Validada")
    }else{
        res.status(401).send("Sesion no validada");
        }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
