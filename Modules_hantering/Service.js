const mysql = require("mysql2/promise") 

async function getConnection() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "users",
  })
}

async function getUsers() {
    console.log("Hämtar användare i modul...")
  
    const connection = await getConnection()
    const result = await connection.execute("SELECT * FROM users")
  
    console.log("resultatet från databasen", result)
  
    await connection.end() 
    return result[0] 
  }

  module.exports = {
    getUsers,
  }