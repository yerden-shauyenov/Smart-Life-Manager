from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from .models import UserSession


class SessionTrackingJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, token = result

            session_key = token.get('session_id')

            if not session_key:
                return result

            try:
                session = UserSession.objects.get(session_key=session_key)
            except UserSession.DoesNotExist:
                raise AuthenticationFailed('Session not found')

            if not session.is_active:
                raise AuthenticationFailed('Session terminated')

            session.last_activity = timezone.now()
            session.save(update_fields=['last_activity'])

        return result