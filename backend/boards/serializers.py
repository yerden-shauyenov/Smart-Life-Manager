from rest_framework import serializers

from users.serializers import UserSerializer
from .models import Board, Task, BoardMembership, Sprint, TaskStatus, TaskPriority, TaskType, BoardRole, Comment, \
    BoardInvitation, OwnershipTransfer


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
        fields = [
            'id', 'board', 'name',
            'can_manage_board', 'can_manage_members', 'can_manage_sprints',
            'can_create_tasks', 'can_edit_tasks', 'can_delete_tasks'
        ]

class BoardMembershipSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    role_name = serializers.ReadOnlyField(source='role.name')

    class Meta:
        model = BoardMembership
        fields = ['id', 'user', 'user_username', 'user_email', 'user_avatar', 'board', 'role', 'role_name', 'joined_at']
        read_only_fields = ['joined_at']


class BoardSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    board_memberships = BoardMembershipSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id', 'title', 'description', 'owner', 'created_at', 'board_memberships']
        read_only_fields = ['owner', 'created_at']


class BoardInvitationSerializer(serializers.ModelSerializer):
    board = BoardSerializer(read_only=True)
    inviter = UserSerializer(read_only=True)
    role = BoardRoleSerializer(read_only=True)

    class Meta:
        model = BoardInvitation
        fields = ['id', 'board', 'inviter', 'email', 'role', 'status', 'created_at']


class OwnershipTransferSerializer(serializers.ModelSerializer):
    board = BoardSerializer(read_only=True)
    from_user = UserSerializer(read_only=True)

    class Meta:
        model = OwnershipTransfer
        fields = ['id', 'board', 'from_user', 'to_user', 'status', 'created_at']

class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ['id', 'board', 'name', 'goal', 'start_date', 'end_date', 'status', 'created_at']
        read_only_fields = ['created_at']


class TaskSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    assignee_username = serializers.ReadOnlyField(source='assignee.username')
    assignee_avatar = serializers.ImageField(source='assignee.avatar', read_only=True)
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
            'author', 'assignee', 'assignee_username', 'assignee_avatar',
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
    author_avatar = serializers.ImageField(source='author.avatar', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'task', 'author', 'author_username', 'author_avatar', 'text', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']