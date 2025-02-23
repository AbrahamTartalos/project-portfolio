'use strict';



// element toggle function
const elementToggleFunc = function(elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function() { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function() {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function() {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function() { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function() {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function(selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function() {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");
// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function() {
    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }
  });
}
// Event listener for form submission
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent default form submission
  // Get form data
  const formData = new FormData(form);
  try {
    const response = await fetch("/submit_form", {
      method: "POST",
      body: formData
    });
    if (response.ok) {
      // Form submitted successfully
      console.log("Form submitted successfully");
      // Show success message to the user
      alert("¡Mensaje enviado correctamente!");
      // Optionally, reset the form
      form.reset();
    } else {
      // Error submitting form
      console.error("Error submitting form:", response.status);
      // Get error message from server response (if available)
      const errorData = await response.json(); // Assuming the server sends JSON with an error message
      const errorMessage = errorData.error || "Hubo un error al enviar el mensaje.";
      // Show error message to the user
      alert(errorMessage);
    }
  } catch (error) {
    console.error("Error:", error);
    // Show error message to the user
    alert("Hubo un error al enviar el mensaje. Intenta de nuevo más tarde.");
  }
});
// --------------------------------------------
const languageToggle = document.getElementById("language-toggle");
const languageButtons = document.querySelectorAll("[data-language-button]");

// ---------Funcion para solicitar al backend la API KEY de DeepL---------
async function getApiKey() {
  try {
    const token = document.querySelector('meta[name="admin-token"]').getAttribute("content"); // Obtiene el token de forma segura

    const response = await fetch("/get-api-key", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      mode: "cors",
      credentials: "include"
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.apiKey;
  } catch (error) {
    console.error("Error al obtener la clave de API:", error);
    return null;
  }
}

//-------------


async function translateText(text, targetLanguage) {
  try {
    const response = await fetch("/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: text, target_lang: targetLanguage })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.translations && data.translations.length > 0) {
      return data.translations[0].text;
    } else {
      throw new Error("La API de DeepL no devolvió ninguna traducción.");
    }
  } catch (error) {
    console.error("Error al traducir el texto:", error);
    return text;
  }
}


function toggleLanguageButton(activeButton, inactiveButton) {
  activeButton.classList.add("active");
  inactiveButton.classList.remove("active");
}
languageToggle.addEventListener("click", async function() {
  const activeButton = document.querySelector(".language-button.active");
  const inactiveButton = document.querySelector(".language-button:not(.active)");
  if (activeButton.textContent === "Español") {
    toggleLanguageButton(inactiveButton, activeButton);
    languageToggle.setAttribute("lang", "en"); // Cambiar el atributo lang del div 
    // Traducir los elementos de la página al inglés
    document.querySelectorAll("h1, h2, h3, p, span, button").forEach(async element => {
      const translatedText = await translateText(element.textContent, "en");
      element.textContent = translatedText;
    });
  } else {
    toggleLanguageButton(inactiveButton, activeButton);
    languageToggle.setAttribute("lang", "es"); // Cambiar el atributo lang del div 
    // Traducir los elementos de la página al español
    document.querySelectorAll("h1, h2, h3, p, span, button").forEach(async element => {
      const translatedText = await translateText(element.textContent, "es");
      //console.log("Texto traducido:", translatedText); 
      element.textContent = translatedText;
    });
  }
});

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function() {

    for (let i = 0; i < pages.length; i++) {
      if (this.innerHTML.toLowerCase() === pages[i].dataset.page) {
        pages[i].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[i].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }

  });
}

// Permite mostrar una caja de texto parra escribir 'otra ciudad' en el formulario
function mostrarOtraCiudad(select) {
  document.getElementById("otra_ciudad").style.display = select.value === "otra" ? "block" : "none";
}

// Elimina el enfoque en todas las partes que no sean una caja de texto
document.addEventListener("click", function (event) {
  const target = event.target;

  // Si el elemento NO es un campo de texto ni un textarea, se le quita el foco
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
    target.blur();
  }
});
