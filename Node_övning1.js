const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/greet', function (req, res) {
    let name = req. query.name;
    if (name === undefined){name = ""}

    res.send('<h1>Hej ' + name + "</h1>")
  })
  

app.listen(3001)