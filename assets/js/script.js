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





// Variables de selección
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

// Evento para abrir/cerrar el menú de selección
select.addEventListener("click", function () {
  this.classList.toggle("active");
});

// Función para filtrar proyectos
const filterFunc = function (selectedValue) {

  filterItems.forEach(item => {
    const category = item.dataset.category ? item.dataset.category.toLowerCase().trim() : "";

    if (selectedValue === "todos" || selectedValue === category) {
      item.style.display = "block"; // Mostrar el proyecto
    } else {
      item.style.display = "none"; // Ocultar el proyecto
    }
  });
};

// Evento en los elementos del menú de selección
selectItems.forEach(item => {
  item.addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase().trim();

    selectValue.innerText = this.innerText;
    select.classList.remove("active");
    filterFunc(selectedValue);
  });
});

// Evento en los botones de filtro
let lastClickedBtn = filterBtn[0];

filterBtn.forEach(btn => {
  btn.addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase().trim();

    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;
  });
});



//  Función para mostrar mensajes dinámicos
function showMessage(message, type = "success") {
  const messageBox = document.getElementById("form-message");
  messageBox.textContent = message;
  messageBox.className = `form-message ${type}`;
  messageBox.style.display = "block";

  // Ocultar el mensaje después de 5 segundos
  setTimeout(() => {
    messageBox.style.display = "none";
  }, 5000);
}

//  Función para manejar el envío del formulario
async function handleFormSubmit(event) {
  // Verificar si el elemento clickeado es un <select>, si es así, no prevenir el comportamiento predeterminado
  if (event.target.tagName.toLowerCase() === "select") {
    return; // Salimos de la función sin ejecutar preventDefault()
  }

  event.preventDefault(); // Prevenir el envío automático solo si no es un <select>

  const formData = new FormData(form);

  try {
    const response = await fetch("/submit_form", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      showMessage("¡Mensaje enviado correctamente!", "success");
      form.reset();
      formBtn.setAttribute("disabled", ""); // Deshabilitar botón después del envío
    } else {
      const errorData = await response.json();
      const errorMessage = errorData.error || "Hubo un error al enviar el mensaje.";
      showMessage(errorMessage, "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showMessage("Hubo un error al enviar el mensaje. Intenta de nuevo más tarde.", "error");
  }
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

// Evento para manejar el envío del formulario
form.addEventListener("submit", handleFormSubmit);

// Evento para habilitar/deshabilitar el botón en tiempo real
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function() {
    formBtn.disabled = !form.checkValidity();
  });
}


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
      element.textContent = translatedText;
    });
  }
});

// Variables de navegación
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// Agregar evento a todos los enlaces de navegación
navigationLinks.forEach((link) => {
  link.addEventListener("click", function () {
    const selectedPage = this.dataset.navLink; // Obtener el valor sin espacios

    pages.forEach((page) => {
      if (page.dataset.page.toLowerCase() === selectedPage) {
        page.classList.add("active");
      } else {
        page.classList.remove("active");
      }
    });

    // Actualizar la clase "active" en los enlaces de navegación
    navigationLinks.forEach((navLink) => {
      navLink.classList.remove("active");
    });
    this.classList.add("active");

    // Desplazar al inicio
    window.scrollTo(0, 0);
  });
});


// Permite mostrar una caja de texto para escribir 'otra ciudad' en el formulario
function mostrarOtraCiudad(select) {
  document.getElementById("otra_ciudad").style.display = select.value === "otra" ? "block" : "none";
}



// Soluciona el problema del desplazamiento de las opcionse del 'select' del formulario
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("select").forEach((select) => {
    select.addEventListener("focus", () => {
      select.size = select.options.length; // Expande el select al hacer foco
    });

    select.addEventListener("blur", () => {
      select.size = 1; // Vuelve a tamaño normal al perder el foco
    });

    select.addEventListener("change", () => {
      select.size = 1; // Vuelve a tamaño normal al seleccionar una opción
    });
  });
});
