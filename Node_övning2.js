const express = require('express')
const app = express()
const path = require('path');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false })) 
app.use(bodyParser.json());

app.post('/target', function (req, res) {
    var Username = req.body.Username;
    var password = req.body.password;
    res.send(`Username: ${Username} <br> Password: ${password}`)
})
  
app.use(express.static(path.join(__dirname,'./Övning2')));

app.listen(3001)