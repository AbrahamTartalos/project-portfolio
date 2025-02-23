from flask import Flask, jsonify, render_template, request, redirect, url_for, flash, abort
from flask_sqlalchemy import SQLAlchemy
from flask_talisman import Talisman
from dotenv import load_dotenv
from flask_session import Session
import os
import requests
import hmac
from models import db, Ciudad, Contacto, Respuesta  # Importamos los modelos propios


# Cargo las variables de entorno
load_dotenv()
SECRET_ADMIN_TOKEN = os.getenv("SECRET_ADMIN_TOKEN", "") # Ayuda a protege contra ataques de timing attack en la comparación de tokens

# Creación y configuración de la app Flask
app = Flask(__name__, static_folder='assets', template_folder='.')
app.config['STATIC_URL_PATH'] = '/assets'
app.config['TEMPLATES_AUTO_RELOAD'] = True
# Configuración de Flask para mensajes flash
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configuración de SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data_formulario.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Proteccion contra ataques XSS, clickjacking, etc.
# Agregar una politica de seguridad personalizada.
CSP = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        "'unsafe-inline'",
        'https://unpkg.com'
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com'
    ],
    'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
    ],
    'img-src': [
        "'self'",
        "data:",
        "https://unpkg.com",
        "https://www.google.com"
    ],
    'connect-src': [
        "'self'",
        'https://unpkg.com',
        "http://127.0.0.1:5000", # En produccion borrar esta linea y dejar 'connect-src' como está
        "https://api-free.deepl.com"
    ],
    'frame-src': [
        "'self'",
        "https://www.google.com"  # Permite cargar Google en iframes
    ]
}

Talisman(app, content_security_policy=CSP)



# Inicializar SQLAlchemy con la app
db.init_app(app)

# Crear BD solo si no existe
with app.app_context():
    if not os.path.exists("data_formulario.db"):
        db.create_all()

#------------------------------------


# Define la ruta principal de la aplicación
@app.route('/')
def index():
    ciudades = Ciudad.query.all() # Obtener todas las ciudades
    admin_token = SECRET_ADMIN_TOKEN  # Carga el token desde .env
    return render_template('index.html', ciudades=ciudades, SECRET_ADMIN_TOKEN=admin_token)



# Define la ruta para manejar la solicitud POST del formulario
@app.route('/submit_form', methods=['POST'])
def submit_form():
    if request.method == "POST":
        nombre = request.form.get("name")
        correo_electronico = request.form.get("correo_electronico")
        numero_telefono = request.form.get("numero_telefono")
        ciudad_id = request.form.get("ciudad_id")
        otra_ciudad = request.form.get("otra_ciudad")
        mensaje = request.form.get("mensaje")
        motivo_contacto = request.form.get("motivo_contacto")
        linkedin_o_web = request.form.get("linkedin_o_web") or None  # Opcional

        # Verificar si se ingresó una ciudad personalizada
        if ciudad_id == "otra" and otra_ciudad:
            nueva_ciudad = Ciudad(nombre_ciudad=otra_ciudad)
            db.session.add(nueva_ciudad)
            db.session.commit()
            ciudad_id = nueva_ciudad.id  # Asignar ID de la nueva ciudad


        # Crear objeto Contacto y guardar en la BD
        try:
            nuevo_contacto = Contacto(
                nombre=nombre,
                correo_electronico=correo_electronico,
                numero_telefono=numero_telefono,
                ciudad_id=ciudad_id,
                mensaje=mensaje,
                motivo_contacto=motivo_contacto,
                linkedin_o_web=linkedin_o_web
            )
            db.session.add(nuevo_contacto)
            db.session.commit()

            flash('¡Envío exitoso!', 'success')
        except Exception as e:
            db.session.rollback()
            flash('Error al enviar el mensaje. Intenta de nuevo más tarde.', 'error')
            print(f"Error en la BD: {e}")

    return redirect(url_for('index'))
    #return render_template('index.html', form=form)


# Ruta para manejar la tarduccion
@app.route('/translate', methods=['POST'])
def translate():
    try:
        data = request.json  # Recibir datos desde el frontend
        text = data.get("text")
        target_lang = data.get("target_lang")

        if not text or not target_lang:
            return jsonify({"error": "Faltan parámetros"}), 400

        # Llamar a la API de DeepL desde el backend
        deepl_api_key = os.getenv("DEEPL_KEY")
        url = "https://api-free.deepl.com/v2/translate"
        headers = {"Authorization": f"DeepL-Auth-Key {deepl_api_key}"}
        params = {"text": text, "target_lang": target_lang}

        response = requests.post(url, headers=headers, data=params)

        if response.status_code == 429:
            return jsonify({"error": "Demasiadas solicitudes. Intenta más tarde."}), 429
        if response.status_code == 456:
            return jsonify({"error": "Clave API de DeepL inválida."}), 401
        if response.status_code != 200:
            return jsonify({"error": "Error en la API de DeepL"}), 500

        return jsonify(response.json())

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Define la ruta para enviar al front-end la API Key de DeepL
@app.route('/get-api-key')
def get_api_key():
    auth_token = request.headers.get("Authorization")
    print(f"Token recibido: {auth_token}")  # 👀 Ver qué token está llegando
    print(f"Token esperado: {SECRET_ADMIN_TOKEN}")  # 👀 Ver qué token espera Flask
    
    if not auth_token:
        return jsonify({'error': 'Falta el token de autorización'}), 403
    
    if not SECRET_ADMIN_TOKEN:
        return jsonify({'error': 'SECRET_ADMIN_TOKEN no está configurado'}), 500

    # Corregir comparando solo el token sin "Bearer "
    token_limpio = auth_token.replace("Bearer ", "")
    print(f"Token esperado: {token_limpio}")  

    if not hmac.compare_digest(token_limpio, SECRET_ADMIN_TOKEN):
        return jsonify({'error': 'Token incorrecto'}), 403

    api_key = os.getenv('DEEPL_KEY')
    if not api_key:
        return jsonify({'error': 'DEEPL_KEY no está configurada'}), 500

    return jsonify({'apiKey': api_key})



if __name__ == '__main__':
    app.run(debug=True)
