"""
Пакет prompts.
Содержит системный промт и функции для сборки сообщений.
"""

from .assembler import build_messages, build_user_message

__all__ = ["build_messages", "build_user_message"]