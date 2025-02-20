from flask import Flask, jsonify, render_template, request, redirect, url_for, flash, abort
from flask_sqlalchemy import SQLAlchemy
from flask_talisman import Talisman
from dotenv import load_dotenv
from flask_session import Session
import os
import hmac
from models import db, Ciudad, Contacto, Respuesta  # Importamos los modelos propios


# Cargo las variables de entorno
load_dotenv()
SECRET_ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "") # Ayuda a protege contra ataques de timing attack en la comparación de tokens

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
Talisman(app)

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
    ciudades = Ciudad.query.all()  # Obtener todas las ciudades
    return render_template('index.html', ciudades=ciudades)


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


# Define la ruta para enviar al front la API Key de DeepL
@app.route('/get-api-key')
def get_api_key():
    auth_token = request.headers.get("Authorization")
    if not auth_token or not SECRET_ADMIN_TOKEN or not hmac.compare_digest(auth_token, SECRET_ADMIN_TOKEN):
        abort(403, description="Acceso denegado")

    return jsonify({'apiKey': os.getenv('DEEPL_KEY')})


if __name__ == '__main__':
    app.run(debug=True)
