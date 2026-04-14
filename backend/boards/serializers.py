from rest_framework import serializers
from .models import Board, Task, BoardMembership

class BoardSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Board
        fields = ['id', 'title', 'description', 'is_public', 'owner', 'created_at']
        read_only_fields = ['owner', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    assignee_username = serializers.ReadOnlyField(source='assignee.username')
    status_name = serializers.ReadOnlyField(source='status.name')
    priority_name = serializers.ReadOnlyField(source='priority.name')
    type_name = serializers.ReadOnlyField(source='task_type.name')

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'board',
            'status', 'status_name',
            'priority', 'priority_name',
            'task_type', 'type_name',
            'author', 'assignee', 'assignee_username',
            'created_at'
        ]
        read_only_fields = ['author', 'created_at']

    def validate(self, data):
        board = data.get('board')
        if data.get('status') and data['status'].board != board:
            raise serializers.ValidationError("Status does not belong to the selected board.")
        if data.get('priority') and data['priority'].board != board:
            raise serializers.ValidationError("Priority does not belong to the selected board.")
        if data.get('task_type') and data['task_type'].board != board:
            raise serializers.ValidationError("Task type does not belong to the selected board.")
        return data