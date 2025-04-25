const express = require('express')
const app = express()
const path = require('path');
const mysql = require('mysql2')
var bodyParser = require('body-parser');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'users'
});

connection.connect();

app.use(bodyParser.urlencoded({ extended: false })) 
app.use(bodyParser.json());

app.get('/users', function (req, res) {
    try {
        const query = 'SELECT * FROM users';
        var text_to_send= ""
        connection.query(query, async (err, results) => {            
            if (err) {
                console.error('something went wrong', err);
                return res.status(500).send('Database error.');
            }
            else{
                text_to_send += "<h1>Usernames:</h1>"
                for (let username = 0; username < results.length; username++){
                    text_to_send += (`-${results[username].username} <br>`)
                }
                res.send(text_to_send)
            
            }

        });
    } catch (error) {
        console.error('Error during password comparison:', error);
        res.status(500).send('Internal server error.');
    }
})
  
app.use(express.static(path.join(__dirname,'./Övning3')));

app.listen(3001)