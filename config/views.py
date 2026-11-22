"""
Production health check and readiness probe views for SERTOS backend.
"""

from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    GET /api/health/ (and /health/)
    Unauthenticated liveness and readiness probe for cloud PaaS, container orchestrators,
    and platform load balancers.
    
    Verifies:
    1. Django application process responsiveness.
    2. Active PostgreSQL connection and query execution.
    3. Operational environment metadata.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        db_status = "connected"
        overall_status = "healthy"
        response_status = status.HTTP_200_OK

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                if not row or row[0] != 1:
                    raise RuntimeError("Database query verification check failed.")
        except Exception as exc:
            db_status = f"unhealthy: {exc}"
            overall_status = "degraded"
            response_status = status.HTTP_503_SERVICE_UNAVAILABLE

        payload = {
            "status": overall_status,
            "database": db_status,
            "service": "sertos-backend",
            "environment": "production" if not settings.DEBUG else "development",
            "timestamp": timezone.now().isoformat(),
        }
        return Response(payload, status=response_status)
