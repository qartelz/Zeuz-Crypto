from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from django.utils.translation import gettext_lazy as _

class SingleSessionJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        
        # Check if the session_id in the token matches the active session in DB
        token_session_id = validated_token.get('session_id')
        
        if not token_session_id:
            # If token doesn't have session_id (legacy tokens), we might allow or block
            # For strict mode, we block.
            # You might want to allow this temporarily during migration.
            return user
            
        if str(token_session_id) != str(user.active_session_id):
            raise AuthenticationFailed(
                _('Session expired. You have logged in on another device.'),
                code='session_expired'
            )
            
        return user
