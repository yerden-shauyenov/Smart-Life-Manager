from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q

from .models import Board, Task, Sprint, TaskStatus, TaskPriority, TaskType, BoardRole, BoardMembership
from .serializers import (
    BoardSerializer, TaskSerializer, SprintSerializer,
    TaskStatusSerializer, TaskPrioritySerializer,
    TaskTypeSerializer, BoardRoleSerializer, BoardMembershipSerializer
)
from .permissions import IsBoardMemberOrPublicReadOnly
from .services import initialize_board_defaults


class BaseBoardSettingsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = self.serializer_class.Meta.model.objects.filter(
            Q(board__is_public=True) |
            Q(board__owner=self.request.user) |
            Q(board__board_memberships__user=self.request.user)
        ).distinct()

        board_id = self.request.query_params.get('board')
        if board_id:
            queryset = queryset.filter(board_id=board_id)

        return queryset

    def perform_create(self, serializer):
        board = serializer.validated_data.get('board')

        is_member_or_owner = (
                self.request.user == board.owner or
                board.board_memberships.filter(user=self.request.user).exists()
        )

        if not is_member_or_owner:
            raise PermissionDenied("You do not have permission to modify settings on this board.")

        serializer.save()


class TaskStatusViewSet(BaseBoardSettingsViewSet):
    serializer_class = TaskStatusSerializer


class TaskPriorityViewSet(BaseBoardSettingsViewSet):
    serializer_class = TaskPrioritySerializer


class TaskTypeViewSet(BaseBoardSettingsViewSet):
    serializer_class = TaskTypeSerializer


class BoardRoleViewSet(BaseBoardSettingsViewSet):
    serializer_class = BoardRoleSerializer


class BoardMembershipViewSet(BaseBoardSettingsViewSet):
    serializer_class = BoardMembershipSerializer

class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [IsAuthenticated, IsBoardMemberOrPublicReadOnly]

    def get_queryset(self):
        return Board.objects.filter(
            Q(is_public=True) |
            Q(owner=self.request.user) |
            Q(board_memberships__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)
        initialize_board_defaults(board)


class SprintViewSet(viewsets.ModelViewSet):
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Sprint.objects.filter(
            Q(board__is_public=True) |
            Q(board__owner=self.request.user) |
            Q(board__board_memberships__user=self.request.user)
        ).distinct()


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            Q(board__is_public=True) |
            Q(board__owner=self.request.user) |
            Q(board__board_memberships__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        board = serializer.validated_data.get('board')

        is_member_or_owner = (
                self.request.user == board.owner or
                board.board_memberships.filter(user=self.request.user).exists()
        )

        if not is_member_or_owner:
            raise PermissionDenied("You do not have permission to add or modify tasks on this board.")

        serializer.save(author=self.request.user)