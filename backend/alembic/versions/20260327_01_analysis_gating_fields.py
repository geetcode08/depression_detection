"""add analysis gating and summary fields

Revision ID: 20260327_01
Revises: 
Create Date: 2026-03-27
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260327_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("cumulative_words", sa.Integer(), nullable=False, server_default="0"))

    with op.batch_alter_table("chat_sessions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("total_user_words", sa.Integer(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("session_summary", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("analysis_tier_reached", sa.String(length=30), nullable=False, server_default="gathering"))
        batch_op.add_column(sa.Column("opener_message_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_chat_sessions_opener_message_id_messages",
            "messages",
            ["opener_message_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("chat_sessions", schema=None) as batch_op:
        batch_op.drop_constraint("fk_chat_sessions_opener_message_id_messages", type_="foreignkey")
        batch_op.drop_column("opener_message_id")
        batch_op.drop_column("analysis_tier_reached")
        batch_op.drop_column("session_summary")
        batch_op.drop_column("total_user_words")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("cumulative_words")
