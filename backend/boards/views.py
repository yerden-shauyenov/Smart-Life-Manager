from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Board, Task
from .serializers import BoardSerializer, TaskSerializer
from .permissions import IsBoardMemberOrPublicReadOnly, IsTaskBoardMemberOrPublicReadOnly


def get(request):
    boards = Board.objects.filter(
        Q(is_public=True) |
        Q(owner=request.user) |
        Q(board_memberships__user=request.user)
    ).distinct()
    serializer = BoardSerializer(boards, many=True)
    return Response(serializer.data)


class BoardListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsBoardMemberOrPublicReadOnly]

    def post(self, request):
        serializer = BoardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(
            Q(board__is_public=True) |
            Q(board__owner=request.user) |
            Q(board__board_memberships__user=request.user)
        ).distinct()
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            board = serializer.validated_data.get('board')
            is_member_or_owner = (
                    request.user == board.owner or
                    board.board_memberships.filter(user=request.user).exists()
            )

            if not is_member_or_owner:
                return Response(
                    {"error": "Нет прав для добавления задач на эту доску."},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)