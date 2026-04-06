"""reemplaza ciudad_id por ciudad string

Revision ID: cc22ae7ee99a
Revises: 
Create Date: 2026-04-02 15:37:04.236818

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cc22ae7ee99a'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Paso 1: eliminar la FK y la columna ciudad_id con batch_alter
    # render_as_batch=True es necesario para SQLite que no soporta DROP COLUMN nativo
    # resolve_fks=False le dice a SQLAlchemy que no intente
    # cargar la tabla ciudades al reflejar contactos
    with op.batch_alter_table(
        'contactos',
        schema=None,
        reflect_args=[],
        reflect_kwargs={'resolve_fks': False}
    ) as batch_op:
        batch_op.drop_column('ciudad_id')
        batch_op.add_column(sa.Column('ciudad', sa.String(length=100), nullable=True))

    # Paso 2: eliminar la tabla ciudades
    op.execute('DROP TABLE IF EXISTS ciudades')


def downgrade():
    op.create_table('ciudades',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nombre_ciudad', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre_ciudad')
    )
    with op.batch_alter_table('contactos', schema=None) as batch_op:
        batch_op.drop_column('ciudad')
        batch_op.add_column(sa.Column('ciudad_id', sa.Integer(), nullable=True))
