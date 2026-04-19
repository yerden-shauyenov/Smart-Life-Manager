import hashlib
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from user_agents import parse
from .models import UserSession


class SessionTrackingJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, token = result
            token_str = str(token)
            token_hash = hashlib.sha256(token_str.encode()).hexdigest()

            session, created = UserSession.objects.get_or_create(
                token_hash=token_hash,
                defaults={'user': user}
            )

            if not session.is_active:
                raise AuthenticationFailed('Сессия была завершена.')

            if created or not session.ip_address:
                user_agent_str = request.META.get('HTTP_USER_AGENT', '')
                user_agent = parse(user_agent_str)

                ip = request.META.get('REMOTE_ADDR')
                x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded:
                    ip = x_forwarded.split(',')[0]

                session.ip_address = ip
                session.os = user_agent.os.family
                session.browser = user_agent.browser.family
                session.device = user_agent.device.family
                session.save()

        return result