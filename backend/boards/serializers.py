from rest_framework import serializers
from .models import Board, Task, BoardMembership, Sprint, TaskStatus, TaskPriority, TaskType, BoardRole, Comment


class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStatus
        fields = ['id', 'board', 'name', 'order']


class TaskPrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskPriority
        fields = ['id', 'board', 'name', 'color_hex', 'level']


class TaskTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskType
        fields = ['id', 'board', 'name', 'icon_name']


class BoardRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardRole
        fields = ['id', 'board', 'name', 'can_manage_board', 'can_manage_members', 'can_create_tasks', 'can_edit_tasks', 'can_delete_tasks']


class BoardMembershipSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    role_name = serializers.ReadOnlyField(source='role.name')

    class Meta:
        model = BoardMembership
        fields = ['id', 'user', 'user_username', 'board', 'role', 'role_name', 'joined_at']
        read_only_fields = ['joined_at']


class BoardSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Board
        fields = ['id', 'title', 'description', 'owner', 'created_at']
        read_only_fields = ['owner', 'created_at']


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ['id', 'board', 'name', 'goal', 'start_date', 'end_date', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class TaskSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    assignee_username = serializers.ReadOnlyField(source='assignee.username')
    status_name = serializers.ReadOnlyField(source='status.name')
    priority_name = serializers.ReadOnlyField(source='priority.name')
    type_name = serializers.ReadOnlyField(source='task_type.name')

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'board', 'sprint',
            'status', 'status_name',
            'priority', 'priority_name',
            'task_type', 'type_name',
            'author', 'assignee', 'assignee_username',
            'start_date', 'due_date', 'is_completed',
            'created_at'
        ]
        read_only_fields = ['author', 'created_at']

    def validate(self, data):
        board = data.get('board', self.instance.board if self.instance else None)

        if data.get('sprint') and data['sprint'].board != board:
            raise serializers.ValidationError("Sprint does not belong to the selected board.")
        if data.get('status') and data['status'].board != board:
            raise serializers.ValidationError("Status does not belong to the selected board.")
        if data.get('priority') and data['priority'].board != board:
            raise serializers.ValidationError("Priority does not belong to the selected board.")
        if data.get('task_type') and data['task_type'].board != board:
            raise serializers.ValidationError("Task type does not belong to the selected board.")
        return data

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Comment
        fields = ['id', 'task', 'author', 'author_username', 'text', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']