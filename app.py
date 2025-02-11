from flask import Flask, jsonify, render_template, request, redirect, url_for, flash
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email
from dotenv import load_dotenv
from flask_session import Session
import sqlite3
import os

# Cargo las variables de entorno desde el archivo .env
load_dotenv()

app = Flask(__name__, static_folder='assets', template_folder='.')
app.config['STATIC_URL_PATH'] = '/assets'
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')  # clave secreta para Flask-WTF de la variable de entorno 'SECRET_KEY'
app.config['TEMPLATES_AUTO_RELOAD'] = True
# conf. de flask para mensajes flash
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

try:
    Session(app)
except Exception as e:
    print(f"Error al configurar las sesiones: {e}")


# Crea la base de datos y la tabla si no existen
def create_database():
    try:
        conn = sqlite3.connect('data_formulario.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullname TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()
        print("Base de datos creada o ya existente.")
    except sqlite3.Error as e:
        print(f"Error al crear la base de datos: {e}")


create_database()


# Define el formulario usando Flask-WTF
class ContactForm(FlaskForm):
    fullname = StringField('fullname', validators=[DataRequired()])
    email = StringField('email',
                        validators=[DataRequired(), Email()])
    message = TextAreaField('messaje', validators=[DataRequired()])
    submit = SubmitField('Enviar')


# Define la ruta principal de la aplicación
@app.route('/')
def index():
    form = ContactForm()
    return render_template('index.html', form=form)


# Define la ruta para manejar la solicitud POST del formulario
@app.route('/submit_form', methods=['POST'])
def submit_form():
    form = ContactForm()
    if form.validate_on_submit(
    ):  # Comprueba si el formulario se ha enviado correctamente
        fullname = form.fullname.data
        email = form.email.data
        message = form.message.data
        print("nombre: ", fullname)
        # Guarda los datos en la base de datos
        try:
            conn = sqlite3.connect('data_formulario.db')
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO contacts (fullname, email, message) VALUES (?, ?, ?)",
                (fullname, email, message))
            conn.commit()
            conn.close()
            flash('¡Envio exitoso!', 'success')
            return redirect(url_for('index'))
        except sqlite3.Error as e:
            print(f"Error al insertar los datos en la base de datos: {e}")
            flash('Error al enviar el mensaje. Intenta de nuevo más tarde.',
                  'error')
            return redirect(url_for('index'))
    return render_template('index.html', form=form)


# Define la ruta para enviar al front la API KEy de DeepL
@app.route('/get-api-key')
def get_api_key():
    api_key = os.getenv('DEEPL_KEY')
    return jsonify({'apiKey': api_key})


if __name__ == '__main__':
    app.run(debug=True)
