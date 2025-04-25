const mysql = require('mysql2');
const express = require('express')
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());

//För att databasen ska fungera korrekt ska du ha en databas Inlämning9 med en tabell guestbook
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "Inlämning9"
 });

con.connect();

//Denna hämtar tidigare skapade inlägg som är lagrade i databasen
app.post('/Hamta_tidigare_guestlogs', async (req, res) => {
    try {
        const query = "SELECT * FROM Guestbook order by id desc";
        con.query(query, async (err, results) => {            
            if (err) {
                return res.status(500);
            }
            else{
                return res.send({ Guestlogs : results});}

        });
    } catch (error) {
        res.status(500);
    }
});

//Denna laddar up en ny rad till databasen med värden som ingick i forms. Den sänder tillbaka ifall anropet lyckades eller inte
app.post('/publicera_guestlog', async (req, res) => {
    try {
        const {Username, Email, Comment, Homepage} = req.body;

        if (!Username || !Email || !Comment) {
            return res.status(400).json({success: false});
        }
        console.log(Username)
        const query = "INSERT INTO Guestbook(Username, Email, Comment, Homepage) Values(?,?,?,?)";
        con.query(query, [Username, Email, Comment, Homepage], async (err, results) => {            
            if (err) {
                return res.status(500).json({success: false});
            } else {
                return res.status(200).json({success: true });
            }
        });
        
    } catch (error) {
        res.status(500).json({success: false});
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './Index.html'));
});

app.use(express.static(path.join(__dirname, '/')));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});