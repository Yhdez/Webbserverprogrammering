const db = require("./Modules_hantering/Service")
const { engine } = require("express-handlebars")
const express = require("express")
const app = express()
const port = 3001

app.use(express.static("public"))

// Sätter upp handlebars som template engine.
app.engine("handlebars", engine())
app.set("view engine", "handlebars")
app.set("views", "./Views_övning4") //Talar om att alla mallar/templates/vyer ligger i mappen views.

app.get("/", (req, res) => {
    res.render("main")
})

app.get("/users", async (req, res) => {
    const users = await db.getUsers() // Hämtar alla users ur databasen
    console.log(users)

    //Säger att vyn users ska användas och man sickar med
    //ett objekt som har en egenskap, "users", som är en array med alla users.
    //Det objektet kan användas av mallen/templaten/vyn.
    res.render("users", { users })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})