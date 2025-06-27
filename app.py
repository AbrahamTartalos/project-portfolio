from flask import Flask, jsonify, render_template, request, redirect, url_for, flash, abort, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_talisman import Talisman
from dotenv import load_dotenv
from flask_session import Session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from limits.storage import RedisStorage
from sqlalchemy.pool import QueuePool
import redis
import os
import requests
import hmac
import re
from models import db, Ciudad, Contacto, Respuesta  # Importamos los modelos propios


# Cargo las variables de entorno
load_dotenv()
SECRET_ADMIN_TOKEN = os.getenv("SECRET_ADMIN_TOKEN", "") # Ayuda a protege contra ataques de timing attack en la comparación de tokens

# Creación y configuración de la app Flask
app = Flask(__name__, static_folder='assets', template_folder='.')
app.config['STATIC_URL_PATH'] = '/assets'
app.config['TEMPLATES_AUTO_RELOAD'] = True
# Configuración de Flask-Session
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True  #  Protege cookies de sesión
app.config["SESSION_COOKIE_SECURE"] = True  # Solo permite cookies en HTTPS

# 🔹 Configuración de Redis para sesiones
if os.getenv("FLASK_ENV") == "development":
    app.config["SESSION_TYPE"] = "filesystem"
else:
    app.config["SESSION_TYPE"] = "redis"
    app.config["SESSION_REDIS"] = redis.from_url(os.getenv("UPSTASH_REDIS_URL"))

Session(app)


# Configuración de SQLAlchemy
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///instance/data_formulario.db")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1) + "?sslmode=require"
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_size": 5,  # Máximo 5 conexiones simultáneas
    "max_overflow": 10,  # Puede crear hasta 10 conexiones extra si es necesario
    "pool_timeout": 30,  # Esperar hasta 30 segundos antes de rechazar la conexión
    "pool_recycle": 1800,  # Cerrar conexiones después de 30 minutos de inactividad
    'connect_args': {
        'sslmode': 'require',
        'connect_timeout': 10  # Aumentar timeout
    }
}

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Obtiene la IP real de cada usuario
def get_real_ip():
    """Obtiene la IP real del usuario considerando proxies en Render"""
    forwarded_for = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    return forwarded_for if forwarded_for else request.remote_addr  # Si no hay proxy, usa remote_addr
# Obtiene IP y Session de cada usuario para un control más preciso
def get_user_identifier():
    """Evita que Flask-Limiter active conexiones innecesarias a la base de datos"""
    try:
        if "session" in globals() and session.modified:  # Solo usa session si fue modificada
            user_id = session.get("user_id", "guest")
        else:
            user_id = "guest"
    except Exception:
        user_id = "guest"

    return f"{get_real_ip()}:{user_id}"


default_limit = os.getenv("LIMITER_DEFAULT", "5 per hour")  # Puede ajustarse en Render

# Configuración de Flask-Limiter para limitar envios de formulario
limiter = Limiter(
    key_func=get_user_identifier,
    storage_uri=os.getenv("UPSTASH_REDIS_URL"),  # Usa Redis en producción 
    app=app
)  

# Proteccion contra ataques XSS, clickjacking, etc.
# Agregar una politica de seguridad personalizada o CSP.
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
        # "http://127.0.0.1:5000", # En produccion borrar esta linea y dejar 'connect-src' como está
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

# Agregar Flask-Migrate
migrate = Migrate(app, db)


# Cierra las conexiones después de cada solicitud para evitar saturación en Supabase
@app.teardown_appcontext
def shutdown_session(exception=None):
    """Cierra la sesión de la base de datos al finalizar cada solicitud"""
    db.session.remove()
#------------------------------------


# Define la ruta principal de la aplicación
@app.route('/')
def index():
    ciudades = Ciudad.query.all() # Obtener todas las ciudades
    admin_token = SECRET_ADMIN_TOKEN  # Carga el token desde .env
    return render_template('index.html', ciudades=ciudades, SECRET_ADMIN_TOKEN=admin_token)



# Define la ruta para manejar la solicitud POST del formulario
@app.route('/submit_form', methods=['POST'])
@limiter.limit(default_limit)  # Aplica la limitación a esta ruta
def submit_form():
    try:
        # Cambiar: Usar request.json en lugar de request.form
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Datos no proporcionados"}), 400
            
        # Extraer datos del JSON
        nombre = data.get("name", "").strip()
        correo_electronico = data.get("correo_electronico", "").strip()
        numero_telefono = data.get("numero_telefono", "").strip()
        ciudad_id = data.get("ciudad_id", "").strip()
        otra_ciudad = data.get("otra_ciudad", "").strip()
        mensaje = data.get("mensaje", "").strip()
        motivo_contacto = data.get("motivo_contacto", "").strip()
        linkedin_o_web = data.get("linkedin_o_web", "").strip() or None
        honeypot = data.get("honeypot", "").strip()

        #  Protección contra bots
        if honeypot:  # Si el honeypot contiene algo, es probable que sea un bot
            flash("Error al enviar el mensaje. Intenta de nuevo más tarde.", "error")
            return redirect(url_for("index"))

        #  Validaciones
        if not nombre or not correo_electronico or not mensaje:
            flash("Todos los campos obligatorios deben completarse.", "error")
            return redirect(url_for("index"))

        email_regex = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
        if not re.match(email_regex, correo_electronico):
            flash("Correo electrónico no válido.", "error")
            return redirect(url_for("index"))

        if numero_telefono and not numero_telefono.isdigit():
            flash("El número de teléfono debe contener solo números.", "error")
            return redirect(url_for("index"))

        #  Verificar si se ingresó una ciudad personalizada
        if ciudad_id == "otra":
            if otra_ciudad:
                # Verificar si la ciudad ya existe
                ciudad_existente = Ciudad.query.filter_by(nombre_ciudad=otra_ciudad).first()
                if ciudad_existente:
                    ciudad_id = ciudad_existente.id
                else:
                    nueva_ciudad = Ciudad(nombre_ciudad=otra_ciudad)
                    db.session.add(nueva_ciudad)
                    db.session.commit()
                    ciudad_id = nueva_ciudad.id
            else:
                return jsonify({
                    "status": "error",
                    "message": "Debe especificar una ciudad"
                }), 400

        #  Crear objeto Contacto y guardar en la BD
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

        # Cambiar: Devolver JSON en lugar de redirección
        return jsonify({
            "status": "success",
            "message": "¡Envío exitoso!"
        }), 200

    except Exception as e:
        # Mejorar: Loggear el error completo
        app.logger.error(f"Error en submit_form: {str(e)}", exc_info=True)
        db.session.rollback()
        
        # Cambiar: Devolver error en JSON
        return jsonify({
            "status": "error",
            "message": "Error interno del servidor"
        }), 500


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
    
    if not auth_token:
        return jsonify({'error': 'Falta el token de autorización'}), 403
    
    if not SECRET_ADMIN_TOKEN:
        return jsonify({'error': 'SECRET_ADMIN_TOKEN no está configurado'}), 500

    # Corregir comparando solo el token sin "Bearer "
    token_limpio = auth_token.replace("Bearer ", "") 

    if not hmac.compare_digest(token_limpio, SECRET_ADMIN_TOKEN):
        return jsonify({'error': 'Token incorrecto'}), 403

    api_key = os.getenv('DEEPL_KEY')
    if not api_key:
        return jsonify({'error': 'DEEPL_KEY no está configurada'}), 500

    return jsonify({'apiKey': api_key})

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify(error="Has alcanzado el límite de envíos. Intenta en una hora."), 429

if __name__ == '__main__':
    # Entorno local detection
    is_render = os.getenv('RENDER') is not None
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    if not is_render and not is_production:
        with app.app_context():
            db.create_all()
    
    app.run(
        debug=not is_production,
        host='0.0.0.0' if is_production else '127.0.0.1',
        port=int(os.getenv('PORT', 5000))
    )
