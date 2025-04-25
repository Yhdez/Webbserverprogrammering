const db = require("./Service")
const express = require("express")
const app = express()
const port = 3001

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.get("/users", async (req, res) => {
  //denna callback är async för att fungera med await i koden
  let users = await db.getUsers()
  let response = `<h1>Users:</h1>`

  users.forEach((user) => {
    response += `<p>${user.username} : ${user.name}</p>`
  })

  res.send(response)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})