from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from rest_framework.response import Response

from users.models import User
from .models import Board, Task, Sprint, TaskStatus, TaskPriority, TaskType, BoardRole, BoardMembership, Comment, \
    OwnershipTransfer, BoardInvitation
from .serializers import (
    BoardSerializer, TaskSerializer, SprintSerializer,
    TaskStatusSerializer, TaskPrioritySerializer,
    TaskTypeSerializer, BoardRoleSerializer, BoardMembershipSerializer, CommentSerializer, OwnershipTransferSerializer,
    BoardInvitationSerializer
)
from .permissions import (
    CanManageBoardSettings, CanManageBoardMembers, CanManageTasks, IsCommentAuthorOrBoardAdmin
)
from .services import initialize_board_defaults


class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Board.objects.filter(
            Q(owner=self.request.user) | Q(board_memberships__user=self.request.user)
        ).distinct().prefetch_related('board_memberships__user', 'board_memberships__role')

    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)
        initialize_board_defaults(board)

    def destroy(self, request, *args, **kwargs):
        board = self.get_object()
        if board.owner != request.user:
            return Response({'detail': 'Only the owner can delete the board.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        board = self.get_object()
        email = request.data.get('email')
        role_name = request.data.get('role', 'Developer')

        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            role = board.roles.get(name=role_name)
        except BoardRole.DoesNotExist:
            available_roles = list(board.roles.values_list('name', flat=True))
            return Response({
                'detail': f'Role "{role_name}" not found for this board.',
                'available_roles': available_roles
            }, status=status.HTTP_400_BAD_REQUEST)

        BoardInvitation.objects.create(
            board=board, inviter=request.user, email=email, role=role
        )
        return Response({'detail': 'Invitation sent.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        board = self.get_object()
        user_id = request.data.get('user_id')
        membership = get_object_or_404(BoardMembership, board=board, user_id=user_id)

        if board.owner_id == int(user_id):
            return Response({'detail': 'The owner cannot be removed. Transfer ownership first.'},
                            status=status.HTTP_400_BAD_REQUEST)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        board = self.get_object()
        if board.owner == request.user:
            return Response({'detail': 'Owner cannot leave. Delete the board or transfer ownership.'}, status=400)

        membership = get_object_or_404(BoardMembership, board=board, user=request.user)
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def transfer_ownership(self, request, pk=None):
        board = self.get_object()
        if board.owner != request.user:
            return Response({'detail': 'Only the current owner can transfer ownership.'}, status=403)

        to_user_id = request.data.get('user_id')
        to_user = get_object_or_404(User, id=to_user_id)

        if not BoardMembership.objects.filter(board=board, user=to_user).exists():
            return Response({'detail': 'User is not a board member.'}, status=status.HTTP_400_BAD_REQUEST)

        OwnershipTransfer.objects.create(
            board=board, from_user=request.user, to_user=to_user
        )
        return Response({'detail': 'Ownership transfer invitation sent.'}, status=status.HTTP_201_CREATED)


class UserInvitationsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BoardInvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BoardInvitation.objects.filter(email=self.request.user.email, status='pending')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        BoardMembership.objects.get_or_create(
            board=invitation.board, user=request.user, defaults={'role': invitation.role}
        )
        invitation.status = 'accepted'
        invitation.save()
        return Response({'detail': 'Invitation accepted.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        invitation = self.get_object()
        invitation.status = 'rejected'
        invitation.save()
        return Response({'detail': 'Invitation rejected.'})


class UserTransfersViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OwnershipTransferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OwnershipTransfer.objects.filter(to_user=self.request.user, status='pending')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        transfer = self.get_object()
        board = transfer.board

        board.owner = transfer.to_user
        board.save()

        admin_role = get_object_or_404(BoardRole, board=board, name='Administrator')

        BoardMembership.objects.filter(board=board, user=transfer.from_user).update(role=admin_role)
        BoardMembership.objects.filter(board=board, user=transfer.to_user).update(role=admin_role)

        transfer.status = 'accepted'
        transfer.save()
        return Response({'detail': 'Ownership accepted.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        transfer = self.get_object()
        transfer.status = 'rejected'
        transfer.save()
        return Response({'detail': 'Ownership transfer rejected.'})

class SprintViewSet(viewsets.ModelViewSet):
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated, CanManageBoardSettings]

    def get_queryset(self):
        queryset = Sprint.objects.filter(
            Q(board__owner=self.request.user) |
            Q(board__board_memberships__user=self.request.user)
        ).distinct()
        board_id = self.request.query_params.get('board')
        if board_id:
            queryset = queryset.filter(board_id=board_id)
        return queryset

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, CanManageTasks]

    def get_queryset(self):
        queryset = Task.objects.filter(
            Q(board__owner=self.request.user) |
            Q(board__board_memberships__user=self.request.user)
        ).distinct()
        board_id = self.request.query_params.get('board')
        sprint_id = self.request.query_params.get('sprint')
        if board_id:
            queryset = queryset.filter(board_id=board_id)
        if sprint_id:
            if sprint_id.lower() == 'none':
                queryset = queryset.filter(sprint__isnull=True)
            else:
                queryset = queryset.filter(sprint_id=sprint_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class BaseBoardSettingsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanManageBoardSettings]

    def get_queryset(self):
        queryset = self.serializer_class.Meta.model.objects.filter(
            Q(board__owner=self.request.user) |
            Q(board__board_memberships__user=self.request.user)
        ).distinct()
        board_id = self.request.query_params.get('board')
        if board_id:
            queryset = queryset.filter(board_id=board_id)
        return queryset

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
    permission_classes = [IsAuthenticated, CanManageBoardMembers]

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, IsCommentAuthorOrBoardAdmin]

    def get_queryset(self):
        queryset = Comment.objects.filter(
            Q(task__board__owner=self.request.user) |
            Q(task__board__board_memberships__user=self.request.user)
        ).distinct()
        task_id = self.request.query_params.get('task')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset

    def perform_create(self, serializer):
        task = serializer.validated_data.get('task')
        is_member_or_owner = (
            self.request.user == task.board.owner or
            task.board.board_memberships.filter(user=self.request.user).exists()
        )
        if not is_member_or_owner:
            raise PermissionDenied("You do not have permission to comment on this task.")
        serializer.save(author=self.request.user)