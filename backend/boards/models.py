from django.db import models
from django.conf import settings


class Board(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_boards')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class BoardRole(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=50)
    can_manage_board = models.BooleanField(default=False)
    can_manage_members = models.BooleanField(default=False)
    can_create_tasks = models.BooleanField(default=True)
    can_edit_tasks = models.BooleanField(default=True)
    can_delete_tasks = models.BooleanField(default=False)

    class Meta:
        unique_together = ('board', 'name')

    def __str__(self):
        return f"{self.board.title} - {self.name}"


class BoardMembership(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memberships')
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='board_memberships')
    role = models.ForeignKey(BoardRole, on_delete=models.SET_NULL, null=True, related_name='members')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'board')

    def __str__(self):
        return f"{self.user.username} - {self.board.title}"


class TaskStatus(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='statuses')
    name = models.CharField(max_length=50)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('board', 'name')
        ordering = ['order']

    def __str__(self):
        return self.name


class TaskPriority(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='priorities')
    name = models.CharField(max_length=50)
    color_hex = models.CharField(max_length=7, default='#808080')
    level = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('board', 'name')
        ordering = ['-level']

    def __str__(self):
        return self.name


class TaskType(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='task_types')
    name = models.CharField(max_length=50)
    icon_name = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ('board', 'name')

    def __str__(self):
        return self.name


class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='tasks')
    status = models.ForeignKey(TaskStatus, on_delete=models.PROTECT, related_name='tasks')
    priority = models.ForeignKey(TaskPriority, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    task_type = models.ForeignKey(TaskType, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tasks')
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='assigned_tasks')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title