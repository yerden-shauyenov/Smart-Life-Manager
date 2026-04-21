from rest_framework import permissions
from types import SimpleNamespace
from .models import Board, BoardMembership


def get_user_role(user, board):
    if user == board.owner:
        return SimpleNamespace(
            can_manage_board=True,
            can_manage_members=True,
            can_create_tasks=True,
            can_edit_tasks=True,
            can_delete_tasks=True
        )
    try:
        return BoardMembership.objects.get(user=user, board=board).role
    except BoardMembership.DoesNotExist:
        return None


class CanManageBoardSettings(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'POST':
            board_id = request.data.get('board')
            if not board_id:
                return True
            try:
                board = Board.objects.get(id=board_id)
                role = get_user_role(request.user, board)
                return role is not None and role.can_manage_board
            except Board.DoesNotExist:
                return False
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        role = get_user_role(request.user, obj.board)
        return role is not None and role.can_manage_board


class CanManageBoardMembers(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'POST':
            board_id = request.data.get('board')
            if not board_id:
                return True
            try:
                board = Board.objects.get(id=board_id)
                role = get_user_role(request.user, board)
                return role is not None and role.can_manage_members
            except Board.DoesNotExist:
                return False
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        role = get_user_role(request.user, obj.board)
        return role is not None and role.can_manage_members


class CanManageTasks(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'POST':
            board_id = request.data.get('board')
            if not board_id:
                return True
            try:
                board = Board.objects.get(id=board_id)
                role = get_user_role(request.user, board)
                return role is not None and role.can_create_tasks
            except Board.DoesNotExist:
                return False
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        role = get_user_role(request.user, obj.board)
        if not role:
            return False
        if request.method in ['PUT', 'PATCH']:
            return role.can_edit_tasks
        if request.method == 'DELETE':
            return role.can_delete_tasks
        return False


class IsCommentAuthorOrBoardAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user == obj.author:
            return True
        role = get_user_role(request.user, obj.task.board)
        return role is not None and role.can_manage_board

class CanManageSprints(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'POST' and 'board' in request.data:
            board_id = request.data.get('board')
            try:
                board = Board.objects.get(id=board_id)
                role = get_user_role(request.user, board)
                return role is not None and (role.can_manage_sprints or role.can_manage_board)
            except Board.DoesNotExist:
                return False
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        role = get_user_role(request.user, obj.board)
        return role is not None and (role.can_manage_sprints or role.can_manage_board)