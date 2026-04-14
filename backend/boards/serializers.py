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

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'board', 'author', 'created_at']
        read_only_fields = ['author', 'created_at']