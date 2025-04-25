const Tidigare_inlägg = document.getElementById("Tidigare_inlägg_div")

function Skapa_tidigare_skapade_inlägg(data){ //Denna funktion kallas när sidan får tillbaka data ifrån hämta_tidigare_inlägg() funktions anropet
  for (let Inlägg = 0; Inlägg < data.Guestlogs.length; Inlägg++){
    Tidigare_inlägg.insertAdjacentHTML('beforeend', `
      <div class='Guestlog_div'>
        <p class='Inlägg_info_text'>Username: ${data.Guestlogs[Inlägg].Username}</p>
        <p class='Inlägg_info_text'>Homepage: ${data.Guestlogs[Inlägg].Homepage}</p>
        <p class='Inlägg_info_text'>Email: ${data.Guestlogs[Inlägg].Email}</p>
        <p class='Inlägg_info_text'>Date Created: ${(data.Guestlogs[Inlägg].Date_created_at)}</p>

        <p class='Inlägg_info_text'>Comment: ${data.Guestlogs[Inlägg].Comment}</p>
      </div>
      `)
  }
}

async function Hämta_tidigare_inlägg() { //Funktion som hämtar datan ifrån servern, tar emot data som ett API, i form av data
  return fetch(`http://localhost:3000/Hamta_tidigare_guestlogs`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
  })
      .then(response => {
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json(); 
      })
      .then(data => {
          console.log('Retrieved data:', data);
          return data; 
      })
      .catch(error => {
          console.error('Error during fetch:', error);
          throw error; 
      });
}

//När användaren trycker på form submit knappen
document.getElementById("form").addEventListener("submit", async function (event) {
  event.preventDefault()

  const formData = { //Samlar alla variabler ifrån form så att de kan skickas igenom fetch requestens body som json
    Username: document.getElementById("Name").value,
    Email: document.getElementById("Email").value,
    Homepage: document.getElementById("Homepage").value,
    Comment: document.getElementById("Comment").value
  };

  try {
        var response = await fetch("http://localhost:3000/publicera_guestlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Skicka JSON till servern
        body: JSON.stringify(formData)
    });
    let result = await response.json();

    if (result.success) { //Ifall guestlog uppdaterades korrekt enligt fetch requesten, skapas en ny rad i tidigare inlägg
      let tid_nu = new Date().toISOString()

        Tidigare_inlägg.insertAdjacentHTML('afterbegin', `
          <div class='Guestlog_div'>
            <p class='Inlägg_info_text'>Username: ${document.getElementById("Name").value}</p>
            <p class='Inlägg_info_text'>Homepage: ${document.getElementById("Homepage").value}</p>
            <p class='Inlägg_info_text'>Email: ${document.getElementById("Email").value}</p>
            <p class='Inlägg_info_text'>Date Created: ${tid_nu}</p>
            
            <p class='Inlägg_info_text'>Comment: ${document.getElementById("Comment").value}</p>
          </div>
          `)
    }
  }
  catch (error){
      console.error("Fel vid skickning:", error);
  }
});

Hämta_tidigare_inlägg().then((data) => { //Hämtar de tidigare tabellraderna ifrån databasen och skickar tillbaka de som ett rest API
  Skapa_tidigare_skapade_inlägg(data);
})