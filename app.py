from flask import Flask, jsonify, render_template, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_talisman import Talisman
from dotenv import load_dotenv
from flask_session import Session
from flask_limiter import Limiter
import redis
import os
import hmac
import re
from models import db, Ciudad, Contacto, Respuesta
import logging

# ---------------------------------------------------------------------------
# LOGGING
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)

# ---------------------------------------------------------------------------
# VARIABLES DE ENTORNO
# ---------------------------------------------------------------------------
load_dotenv()

SECRET_ADMIN_TOKEN = os.getenv("SECRET_ADMIN_TOKEN", "")

# ---------------------------------------------------------------------------
# APP FLASK
# ---------------------------------------------------------------------------
app = Flask(__name__, static_folder='assets', template_folder='.')
app.config['STATIC_URL_PATH'] = '/assets'
app.config['TEMPLATES_AUTO_RELOAD'] = True

# ---------------------------------------------------------------------------
# SECRET KEY — falla explícitamente si no está definida
# ---------------------------------------------------------------------------
_secret_key = os.getenv('SECRET_KEY')
if not _secret_key:
    raise RuntimeError(
        "SECRET_KEY no está definida. "
        "Agregala en tu .env o en las variables de entorno de Render."
    )
app.config['SECRET_KEY'] = _secret_key

# ---------------------------------------------------------------------------
# FLASK-SESSION
# ---------------------------------------------------------------------------
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True   # Protege cookies de sesión
app.config["SESSION_COOKIE_SECURE"] = True  # Solo HTTPS

if os.getenv("FLASK_ENV") == "development":
    app.config["SESSION_TYPE"] = "filesystem"
else:
    app.config["SESSION_TYPE"] = "redis"
    app.config["SESSION_REDIS"] = redis.from_url(os.getenv("UPSTASH_REDIS_URL"))

Session(app)

# ---------------------------------------------------------------------------
# SQLALCHEMY
# ---------------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///instance/data_formulario.db")

# Convierte ruta SQLite relativa a absoluta (necesario en Windows)
if DATABASE_URL.startswith("sqlite:///") and not DATABASE_URL.startswith("sqlite:////"):
    db_relative_path = DATABASE_URL.replace("sqlite:///", "")
    db_absolute_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), db_relative_path
    )
    os.makedirs(os.path.dirname(db_absolute_path), exist_ok=True)
    DATABASE_URL = f"sqlite:///{db_absolute_path}"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1) + "?sslmode=require"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

is_sqlite = DATABASE_URL.startswith("sqlite")
if is_sqlite:
    # SQLite local: sin pool ni SSL
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {}
else:
    # PostgreSQL / Supabase en producción
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "connect_args": {
            "sslmode": "require",
            "connect_timeout": 10,
        },
    }

# ---------------------------------------------------------------------------
# RATE LIMITER
# ---------------------------------------------------------------------------
def get_real_ip():
    """Obtiene la IP real del usuario considerando proxies en Render."""
    forwarded_for = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    return forwarded_for if forwarded_for else request.remote_addr


def get_user_identifier():
    """Clave de rate limiting: IP + session_id (evita llamadas innecesarias a la DB)."""
    try:
        user_id = session.get("user_id", "guest") if session.modified else "guest"
    except Exception:
        user_id = "guest"
    return f"{get_real_ip()}:{user_id}"


default_limit = os.getenv("LIMITER_DEFAULT", "5 per hour")

limiter = Limiter(
    key_func=get_user_identifier,
    storage_uri=os.getenv("UPSTASH_REDIS_URL"),
    app=app,
)

# ---------------------------------------------------------------------------
# CONTENT SECURITY POLICY
# ---------------------------------------------------------------------------
CSP = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        "'unsafe-inline'",
        'https://unpkg.com',
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
    ],
    'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
    ],
    'img-src': [
        "'self'",
        "data:",
        "https://unpkg.com",
        "https://www.google.com",
    ],
    'connect-src': [
        "'self'",
        'https://unpkg.com',
    ],
    'frame-src': [
        "'self'",
        "https://www.google.com",
    ],
}

Talisman(app, content_security_policy=CSP)

# ---------------------------------------------------------------------------
# DB + MIGRATIONS
# ---------------------------------------------------------------------------
db.init_app(app)
migrate = Migrate(app, db)


@app.teardown_appcontext
def shutdown_session(exception=None):
    """Cierra la sesión de la DB al finalizar cada request."""
    db.session.remove()


# ---------------------------------------------------------------------------
# RUTAS
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    ciudades = Ciudad.query.all()
    return render_template('index.html', ciudades=ciudades, SECRET_ADMIN_TOKEN=SECRET_ADMIN_TOKEN)


@app.route('/submit_form', methods=['POST'])
@limiter.limit(default_limit)
def submit_form():
    app.logger.info("Nueva solicitud a /submit_form")

    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "Datos no proporcionados"}), 400

        nombre            = data.get("name", "").strip()
        correo_electronico = data.get("correo_electronico", "").strip()
        numero_telefono   = data.get("numero_telefono", "").strip()
        ciudad_id         = data.get("ciudad_id", "").strip()
        otra_ciudad       = data.get("otra_ciudad", "").strip()
        mensaje           = data.get("mensaje", "").strip()
        motivo_contacto   = data.get("motivo_contacto", "").strip()
        linkedin_o_web    = data.get("linkedin_o_web", "").strip() or None
        honeypot          = data.get("honeypot", "").strip()

        # Honeypot — responde como éxito para no revelar la detección
        if honeypot:
            return jsonify({"status": "success", "message": "¡Envío exitoso!"}), 200

        if not nombre or not correo_electronico or not mensaje:
            return jsonify({"status": "error", "message": "Todos los campos obligatorios deben completarse."}), 400

        email_regex = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
        if not re.match(email_regex, correo_electronico):
            return jsonify({"status": "error", "message": "Correo electrónico no válido."}), 400

        if numero_telefono and not numero_telefono.isdigit():
            return jsonify({"status": "error", "message": "El número de teléfono debe contener solo números."}), 400

        if linkedin_o_web:
            url_regex = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
            if not re.match(url_regex, linkedin_o_web):
                return jsonify({
                    "status": "error",
                    "message": "La URL de LinkedIn/web no es válida. Debe comenzar con http:// o https://",
                }), 400

        if ciudad_id == "otra":
            if not otra_ciudad:
                return jsonify({"status": "error", "message": "Debe especificar una ciudad."}), 400
            ciudad_existente = Ciudad.query.filter_by(nombre_ciudad=otra_ciudad).first()
            if ciudad_existente:
                ciudad_id = ciudad_existente.id
            else:
                nueva_ciudad = Ciudad(nombre_ciudad=otra_ciudad)
                db.session.add(nueva_ciudad)
                db.session.flush()
                ciudad_id = nueva_ciudad.id

        nuevo_contacto = Contacto(
            nombre=nombre,
            correo_electronico=correo_electronico,
            numero_telefono=numero_telefono,
            ciudad_id=ciudad_id,
            mensaje=mensaje,
            motivo_contacto=motivo_contacto,
            linkedin_o_web=linkedin_o_web,
        )

        db.session.add(nuevo_contacto)
        db.session.commit()

        app.logger.info(f"Contacto guardado — ID: {nuevo_contacto.id}")

        return jsonify({"status": "success", "message": "¡Envío exitoso!"}), 200

    except Exception as e:
        app.logger.error(f"Error en /submit_form: {str(e)}", exc_info=True)
        db.session.rollback()
        # No se expone el detalle del error al cliente
        return jsonify({"status": "error", "message": "Error interno. Por favor intentá de nuevo más tarde."}), 500


# ---------------------------------------------------------------------------
# ERROR HANDLERS
# ---------------------------------------------------------------------------

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify(error="Has alcanzado el límite de envíos. Intentá de nuevo en una hora."), 429


@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Recurso no encontrado."), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify(error="Error interno del servidor."), 500


# ---------------------------------------------------------------------------
# ENTRYPOINT
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    is_render     = os.getenv('RENDER') is not None
    is_production = os.getenv('FLASK_ENV') == 'production'

    if not is_render and not is_production:
        with app.app_context():
            db.create_all()

    app.run(
        debug=not is_production,
        host='0.0.0.0' if is_production else '127.0.0.1',
        port=int(os.getenv('PORT', 5000)),
    )