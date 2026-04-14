from rest_framework import permissions


class IsBoardMemberOrPublicReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        is_member_or_owner = (
                request.user == obj.owner or
                obj.board_memberships.filter(user=request.user).exists()
        )

        if request.method in permissions.SAFE_METHODS:
            return obj.is_public or is_member_or_owner

        return is_member_or_owner


class IsTaskBoardMemberOrPublicReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        board = obj.board
        is_member_or_owner = (
                request.user == board.owner or
                board.board_memberships.filter(user=request.user).exists()
        )

        if request.method in permissions.SAFE_METHODS:
            return board.is_public or is_member_or_owner

        return is_member_or_owner