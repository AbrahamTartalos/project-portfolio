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
if (select) {
  select.addEventListener("click", function () {
    this.classList.toggle("active");
  });
}

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
  if (messageBox) {
    messageBox.textContent = message;
    messageBox.className = `form-message ${type}`;
    messageBox.style.display = "block";

    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 5000);
  } else {
    // Fallback si no existe el elemento
    alert(message);
  }
}

// Función de validación personalizada para URL opcional
function validateOptionalUrl(url) {
  if (!url || url.trim() === '') {
    return true; // Campo vacío es válido (opcional)
  }
  
  // Patrón más flexible para URLs
  const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/i;
  return urlPattern.test(url.trim());
}

//  Función para manejar el envío del formulario - CORREGIDA
async function handleFormSubmit(event) {
  // Verificar si el elemento clickeado es un <select>
  if (event.target.tagName.toLowerCase() === "select") {
    return;
  }

  event.preventDefault();

  // Obtener el formulario desde el evento - CORRECCIÓN PRINCIPAL
  const form = event.target;
  
  // Verificar que el formulario existe
  if (!form) {
    console.error("Formulario no encontrado");
    return;
  }

  try {
    // 1. Crear objeto con los datos del formulario - CORREGIR nombres de campos
    const formData = {
      name: form.elements.name ? form.elements.name.value.trim() : '',
      correo_electronico: form.elements.email ? form.elements.email.value.trim() : '',
      numero_telefono: form.elements.phone ? form.elements.phone.value.trim() : '',
      ciudad_id: form.elements.city ? form.elements.city.value : '',
      otra_ciudad: form.elements.otherCity ? form.elements.otherCity.value.trim() : '',
      mensaje: form.elements.message ? form.elements.message.value.trim() : '',
      motivo_contacto: form.elements.reason ? form.elements.reason.value : '',
      linkedin_o_web: form.elements.linkedin ? form.elements.linkedin.value.trim() : '',
      honeypot: form.elements.honeypot ? form.elements.honeypot.value.trim() : ''
    };

    // Debug: Mostrar datos que se van a enviar
    console.log("Datos del formulario:", formData);

    // Validación básica en el frontend
    if (!formData.name || !formData.correo_electronico || !formData.mensaje) {
      showMessage("Por favor completa todos los campos obligatorios", "error");
      return;
    }

    // Validación del campo LinkedIn/Web (opcional pero debe ser URL válida si se llena)
    if (formData.linkedin_o_web && !validateOptionalUrl(formData.linkedin_o_web)) {
      showMessage("Por favor ingresa una URL válida en el campo LinkedIn/Web o déjalo vacío", "error");
      return;
    }

    // Deshabilitar el botón mientras se procesa
    const submitButton = form.querySelector("[data-form-btn]");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    // 2. Enviar como JSON
    const response = await fetch("/submit_form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(formData)
    });

    // Verificar si la respuesta es JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("El servidor no devolvió JSON válido");
    }

    // 3. Manejar respuesta JSON
    const responseData = await response.json();
    
    if (response.ok) {
      showMessage("¡Mensaje enviado correctamente!", "success");
      form.reset();
      
      // Ocultar campo "otra ciudad" si estaba visible
      const otraCiudadDiv = document.getElementById("otra_ciudad");
      if (otraCiudadDiv) {
        otraCiudadDiv.style.display = "none";
      }
    } else {
      // Usar el mensaje de error del backend
      showMessage(responseData.message || "Hubo un error al enviar el mensaje.", "error");
    }
  } catch (error) {
    console.error("Error completo:", error);
    showMessage("Error de conexión con el servidor. Por favor intenta nuevamente.", "error");
  } finally {
    // Rehabilitar el botón
    const submitButton = form.querySelector("[data-form-btn]");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar mensaje";
    }
  }
}

// Inicialización del formulario - CORREGIDA
document.addEventListener("DOMContentLoaded", function() {
  // contact form variables
  const form = document.querySelector("[data-form]");
  const formInputs = document.querySelectorAll("[data-form-input]");
  const formBtn = document.querySelector("[data-form-btn]");

  if (!form) {
    console.warn("Formulario no encontrado en la página");
    return;
  }

  // Evento para manejar el envío del formulario
  form.addEventListener("submit", handleFormSubmit);

  // Remover validación HTML5 del campo LinkedIn para hacerlo verdaderamente opcional
  const linkedinField = form.elements.linkedin;
  if (linkedinField) {
    linkedinField.removeAttribute('required');
    linkedinField.removeAttribute('pattern');
    // Agregar validación personalizada
    linkedinField.addEventListener('input', function() {
      const value = this.value.trim();
      if (value === '' || validateOptionalUrl(value)) {
        this.setCustomValidity('');
      } else {
        this.setCustomValidity('Por favor ingresa una URL válida o deja el campo vacío');
      }
    });
  }

  // Evento para habilitar/deshabilitar el botón en tiempo real
  if (formInputs.length > 0 && formBtn) {
    formInputs.forEach(input => {
      input.addEventListener("input", function() {
        // Validación personalizada que no requiere LinkedIn
        let isValid = true;
        
        // Verificar campos obligatorios
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            isValid = false;
          }
        });
        
        // Verificar LinkedIn si tiene contenido
        const linkedinField = form.elements.linkedin;
        if (linkedinField && linkedinField.value.trim() && !validateOptionalUrl(linkedinField.value)) {
          isValid = false;
        }
        
        formBtn.disabled = !isValid;
      });
    });
  }
});

// --------------------------------------------
const languageToggle = document.getElementById("language-toggle");
const languageButtons = document.querySelectorAll("[data-language-button]");

// ---------Funcion para solicitar al backend la API KEY de DeepL---------
async function getApiKey() {
  try {
    const tokenMeta = document.querySelector('meta[name="admin-token"]');
    if (!tokenMeta) {
      throw new Error("Token meta tag no encontrado");
    }
    
    const token = tokenMeta.getAttribute("content");

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

if (languageToggle) {
  languageToggle.addEventListener("click", async function() {
    const activeButton = document.querySelector(".language-button.active");
    const inactiveButton = document.querySelector(".language-button:not(.active)");
    
    if (activeButton && inactiveButton) {
      if (activeButton.textContent === "Español") {
        toggleLanguageButton(inactiveButton, activeButton);
        languageToggle.setAttribute("lang", "en");
        // Traducir los elementos de la página al inglés
        document.querySelectorAll("h1, h2, h3, p, span, button").forEach(async element => {
          const translatedText = await translateText(element.textContent, "en");
          element.textContent = translatedText;
        });
      } else {
        toggleLanguageButton(inactiveButton, activeButton);
        languageToggle.setAttribute("lang", "es");
        // Traducir los elementos de la página al español
        document.querySelectorAll("h1, h2, h3, p, span, button").forEach(async element => {
          const translatedText = await translateText(element.textContent, "es");
          element.textContent = translatedText;
        });
      }
    }
  });
}

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
  const otraCiudadDiv = document.getElementById("otra_ciudad");
  if (otraCiudadDiv) {
    otraCiudadDiv.style.display = select.value === "otra" ? "block" : "none";
  }
}

// Soluciona el problema del desplazamiento de las opciones del 'select' del formulario
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

// Muestra mi número de celular en la Sidebar
document.addEventListener("DOMContentLoaded", function () {
  const phoneLink = document.getElementById("phone-link");
  if (phoneLink) {
    let clicked = false; // Variable para rastrear si el usuario ya hizo clic una vez
    
    phoneLink.addEventListener("click", function (event) {
        event.preventDefault();
        
        if (!clicked) {
          // Primer clic: mostrar el número
          this.textContent = "+54 (387) 227-7116";
          this.href = "https://wa.me/543872277116"; // Prepara el enlace
          clicked = true;
      } else {
          // Segundo clic: redirigir a WhatsApp
          window.open(this.href, "_blank");
      }
    });
  }
});