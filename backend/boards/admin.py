from django.contrib import admin
from .models import Board, BoardMembership, Task

admin.site.register(Board)
admin.site.register(BoardMembership)
admin.site.register(Task)