const express = require("express")
const app = express()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

// parse application/json, för att hantera att man POSTar med JSON
const bodyParser = require("body-parser")
 
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

async function getDBConnnection() {
  // Här skapas ett databaskopplings-objekt med inställningar för att ansluta till servern och databasen.
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "users",
  })
}

async function Authentication(req, res){ // Denna funktion körs för att se ifall användaren är korrekt inloggad, igenom att validera token. Den returnerar antingen true eller false
    let authHeader = req.headers['authorization']

    if (!authHeader) {
     res.sendStatus(400)
     return false
    }
    let token = authHeader.slice(7)
    let decoded

    try {
      decoded = jwt.verify(token, 'SecretPassword')

    } 
    catch (error) {
        res.status(401).send('Invalid auth token')
        return false
    }

    return true
}

async function Validate_indata(indata){ //Validerar ifall indatan är godtagbar, jämför tidigare databas värden och ser ifall indatan är unik eller inte
    if(!indata.Username || !indata.Email || !indata.Name || !indata.Password){
        return false //Ifall någon indata inte är angiven
    }

    let sql = `SELECT Username,email,name FROM users`
    let connection = await getDBConnnection()

    let [results] = await connection.execute(sql)

    for (let User = 0; User < results.length; User++){
        if((indata.Username === results[User].Username) || (indata.Email === results[User].email) || (indata.Name === results[User].name)){
            return false //Indatan är inte unik och valideras som false
        }
    }
    return true //Indatan är unik och valideras som true
}

app.get("/", (req, res) => {
    res.send(`<h1>Doumentation Routes</h1>
    <ul>
        <li>(inloggning krävs)<b> GET /users </b>- Hämtar alla användare i databasen och listar alla namn</li>
        <li>(inloggning krävs)<b> GET /users/{id} </b>- Returnerar användaren vilket har den angivna id'en</li>
        <li>(inloggning krävs)<b> POST /users </b>- Skapar en ny användare i databasen. Accepterar ett json format med Username, Name, Email och Password. Alla värden förutom password behöver vara unikt gentemot de andra värdena i databasen</li>
        <li>(inloggning krävs)<b> PUT /users/{id} </b>- Uppdaterar användaren som har den angivna id'en. json format med Username, Name och Email behövs och anger vad den id'en ska innehålla istället. Alla Värdena behöver vara unika gentemot vad som redan existerar i databasen</li>
        <li><b> POST /login </b>- loggar in användaren ifall användaren har ett hashat lösenord och finns med i databasen. Returnerar en token</li>
    </ul>`)
})

app.get("/users", async function (req, res) { //Hämtar alla användare och listar dem
    try{
        const Authentication_success = await Authentication(req, res)
        if(!Authentication_success){return}
    
        let connection = await getDBConnnection()
        let response = ""
        let sql = `SELECT Username from users`   
        let [results] = await connection.execute(sql)
    
        for (let User = 0; User < results.length; User++){ //Lists all users in the database
            response += `${User + 1}. ${results[User].Username}<br>`
        }
      
        res.send(response)
    }
    catch (error){
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.get("/users/:id", async function (req, res) { //Hämtar en användare med den angivna id'en
    try{
        const Authentication_success = await Authentication(req, res)
        if(!Authentication_success){return}
    
        let connection = await getDBConnnection()
        let sql = `SELECT * from users where id = ?`   
        let [results] = await connection.execute(sql, [req.params.id])
    
        if(!results[0]){res.sendStatus(204)} //Om användaren inte existerar
        else{
            res.json(results[0])
        }
    }
    catch (error){
        res.status(500).json({ error: 'Internal server error' })
    }
})


app.post('/users', async function (req, res){ //Skapar en ny användare i databasen
    try{
        const Authentication_success = await Authentication(req, res)
        if(!Authentication_success){return}
    
        if (await Validate_indata(req.body)){ //Validerar indatan och ser ifall värdena är unika och/eller existerande
            let Username = req.body.Username
            let Name = req.body.Name
            let Password = req.body.Password
            let Email = req.body.Email

            const salt = await bcrypt.genSalt(10);  // genererar ett salt till hashning
            const hashedPassword = await bcrypt.hash(Password, salt); //hashar lösenordet
    
            let sql = `INSERT INTO users(username, name, password, email) values(?,?,?,?)`
    
            let connection = await getDBConnnection()
            let [Results] = await connection.execute(sql, [Username, Name, hashedPassword, Email])
    
            res.json(Results)
        }
        else{
            res.status(422).send("Wrong indata sent to server")
        }
    }
    catch (error){
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.put("/users/:id", async function (req, res) { //Uppdatterar användaren i databasen med ett specifikt id
    const Authentication_success = await Authentication(req, res)
    if(!Authentication_success){return}

    try{
        if (await Validate_indata(req.body)){ //Validerar indatan och ser ifall värdena är unika och/eller existerande
            let connection = await getDBConnnection()

            let sql = `UPDATE users
            SET Username = ?, Name =?, Email = ?
            WHERE id = ?`
    
            let [results] = await connection.execute(sql, [
            req.body.Username,
            req.body.Name,
            req.body.Email,
            req.params.id,
            ])
    
            if(results.affectedRows > 0){ //Om en användare ändras
                res.status(200).send(results)
            }
            else{ //Ingen användare hittades på den id'en
                res.status(404).send(results)
            }
        }
        else{
            res.status(422).send("Wrong indata sent to server")
        }
    }
    catch (error){
        res.status(500).json({ error: 'Internal server error' })
    }
})

   

app.post('/login', async function(req, res) { //Sköter inloggning av användaren

    try{
        let connection = await getDBConnnection()
        const {Password, Username } = req.body;

        //kod här för att hantera anrop…
        let sql = "SELECT * FROM users WHERE username = ?"
        let [results] = await connection.execute(sql, [Username])
        let HashedPasswordFromDB = results[0].password

        const isPasswordValid = await bcrypt.compare(Password, HashedPasswordFromDB);

        if (isPasswordValid) {
            let payload = {
                sub: results[0].id, 
                name: results[0].name 
            }
            let token = jwt.sign(payload, "SecretPassword", { expiresIn: '60m' })
            res.status(200).send(token)

        } 
        else {
            res.status(400).json({ error: 'Invalid credentials' });
        }
    }   
    catch(error){
        res.status(500).json({ error: 'Internal server error' })
    }
});
   
  
    
const port = 3000
app.listen(port, () => {
console.log(`Server listening on http://localhost:${port}`)
})