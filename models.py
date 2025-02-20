from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Instancia global de SQLAlchemy (será inicializada en app.py)
db = SQLAlchemy()

class Ciudad(db.Model):
    __tablename__ = 'ciudades'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre_ciudad = db.Column(db.String(100), nullable=False, unique=True)

    # Relación con Contactos (una ciudad puede tener muchos contactos)
    contactos = db.relationship('Contacto', backref='ciudad', lazy=True)

class Contacto(db.Model):
    __tablename__ = 'contactos'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    correo_electronico = db.Column(db.String(120), nullable=False, unique=True)
    numero_telefono = db.Column(db.String(20), nullable=True)
    ciudad_id = db.Column(db.Integer, db.ForeignKey('ciudades.id'), nullable=True)
    mensaje = db.Column(db.Text, nullable=False)
    fecha_hora_contacto = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    motivo_contacto = db.Column(db.String(255), nullable=False)
    linkedin_o_web = db.Column(db.String(255), nullable=True)

    # Relación con Respuestas (un contacto puede tener muchas respuestas)
    respuestas = db.relationship('Respuesta', backref='contacto', lazy=True)

class Respuesta(db.Model):
    __tablename__ = 'respuestas'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    contacto_id = db.Column(db.Integer, db.ForeignKey('contactos.id'), nullable=False)
    respuesta = db.Column(db.Text, nullable=False)
    fecha_hora_respuesta = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
