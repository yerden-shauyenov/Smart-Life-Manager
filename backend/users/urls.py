from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserProfileView, ChangePasswordView, UserSessionViewSet, RegisterView, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'sessions', UserSessionViewSet, basename='user-sessions')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('me/', include(router.urls)),
]