from django.contrib import admin
from .models import (
    Board, BoardRole, BoardMembership,
    TaskStatus, TaskPriority, TaskType,
    Sprint, Task, Comment
)

@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'owner', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'owner__username')
    ordering = ('-created_at',)

@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'board', 'status', 'start_date', 'end_date')
    list_filter = ('status', 'board')
    search_fields = ('name',)
    ordering = ('-created_at',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'board', 'sprint', 'status', 'priority', 'author', 'assignee')
    list_filter = ('board', 'status', 'priority', 'task_type')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'author', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('text',)
    ordering = ('-created_at',)

@admin.register(BoardRole)
class BoardRoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'board', 'can_manage_board')
    list_filter = ('board', 'can_manage_board')

@admin.register(BoardMembership)
class BoardMembershipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'board', 'role')
    list_filter = ('board',)

@admin.register(TaskStatus)
class TaskStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'board', 'order')
    list_filter = ('board',)
    ordering = ('board', 'order')

@admin.register(TaskPriority)
class TaskPriorityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'board', 'level', 'color_hex')
    list_filter = ('board',)
    ordering = ('board', '-level')

@admin.register(TaskType)
class TaskTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'board')
    list_filter = ('board',)