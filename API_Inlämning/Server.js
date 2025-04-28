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

async function Authentication(req, res){ // Denna funktion körs för att se ifall användaren är korrekt inloggad, igenom att validera token
    let token = req.headers['authorization']

    if (!token) {
     res.sendStatus(400)
     return false
    }
    let decoded

    try {
      decoded = jwt.verify(token, 'SecretPassword')

    } catch (err) {
      console.log(err)
      res.status(401).send('Invalid auth token')
      return false
    }

    return true
}

app.get("/", (req, res) => {
    res.send(`<h1>Doumentation EXEMPEL</h1>
    <ul><li> GET /users</li></ul>`)
})

app.get("/users", async function (req, res) {
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
    finally {
        if (connection) {
            await connection.end()
        }
    }
})

app.get("/users/:id", async function (req, res) {
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
    finally {
        if (connection) {
            await connection.end()
        }
    }
})

//Post Request
app.post('/users', async function (req, res){
    try{
        async function Validate_indata_for_users(indata){ //Validerar ifall indatan är godtagbar, jämför tidigare databas värden och ser ifall indatan är unik eller inte
            if(!indata.Username || !indata.Email || !indata.Name || !indata.Password){
                return false //Ifall någon indata inte är angiven
            }

            let sql = `SELECT Username,email,name FROM users`
            let connection = await getDBConnnection()
    
            let [results] = await connection.execute(sql)
            
            console.log(indata)
                for (let User = 0; User < results.length; User++){
                    if((indata.Username === results[User].Username) || (indata.Email === results[User].email) || (indata.Name === results[User].name)){
                        return false //Indatan är inte unik och valideras som false
                    }
                }
                return true //Indatan är unik och valideras som true
        }
    
        if (await Validate_indata_for_users(req.body)){
            let Username = req.body.Username
            let Name = req.body.Name
            let Password = req.body.Password
            let Email = req.body.Email
    
            let sql = `INSERT INTO users(username, name, password, email) values(?,?,?,?)`
    
            let connection = await getDBConnnection()
            let [Results] = await connection.execute(sql, [Username, Name, Password, Email])
    
            res.json(Results)
        }
        else{
            res.status(422).send("Wrong indata sent to server")
        }
    }
    catch (error){
        res.status(500).json({ error: 'Internal server error' })
    }
    finally {
        if (connection) {
            await connection.end()
        }
    }
})

app.put("/users/:id", async function (req, res) {
    const Authentication_success = await Authentication(req, res)
    if(!Authentication_success){return}

    try{
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

        if([results]){
            res.send(results)
        }
        else{
            res.status(200).send(results)
        }
    }
    catch (error){
        res.status(500).json({ error: 'Internal server error' })
    }
    finally {
        if (connection) {
            await connection.end()
        }
    }
})

app.post('/register', async function(req, res) {
    
    try{
        let connection = await getDBConnnection()
            
        const {Name, Email, Password, Username } = req.body;
        const salt = await bcrypt.genSalt(10);  // genererar ett salt till hashning
        const hashedPassword = await bcrypt.hash(Password, salt); //hashar lösenordet

        let sql = `UPDATE users
        set password = ?
        where username = ? and email = ? and name = ?
        `

        let [Results] = await connection.execute(sql, [hashedPassword, Username, Email, Name])
        
        res.json(Results)
    }   
    catch (error){
        res.status(500).json({ error: 'Internal server error' })
    }
    finally {
        if (connection) {
            await connection.end()
        }
    }

});
   

app.post('/login', async function(req, res) {

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
    finally {
        if (connection) {
            await connection.end()
        }
    }
});
   
  
    
const port = 3000
app.listen(port, () => {
console.log(`Server listening on http://localhost:${port}`)
})