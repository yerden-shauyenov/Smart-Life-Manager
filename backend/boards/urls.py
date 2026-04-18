from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BoardViewSet, TaskViewSet, SprintViewSet,
    TaskStatusViewSet, TaskPriorityViewSet, TaskTypeViewSet,
    BoardRoleViewSet, BoardMembershipViewSet, CommentViewSet
)

router = DefaultRouter()
router.register(r'boards', BoardViewSet, basename='board')
router.register(r'sprints', SprintViewSet, basename='sprint')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'statuses', TaskStatusViewSet, basename='status')
router.register(r'priorities', TaskPriorityViewSet, basename='priority')
router.register(r'types', TaskTypeViewSet, basename='type')
router.register(r'roles', BoardRoleViewSet, basename='role')
router.register(r'memberships', BoardMembershipViewSet, basename='membership')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
]