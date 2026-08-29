import pytest
from fastapi import APIRouter
from app.domain.exceptions.domain_exception import DomainException
from app.infrastructure.start.main import app


class TestExceptionHandlingIntegration:

    def test_global_domain_exception_handler(self, client):
        # Create a temporary test endpoint that raises a DomainException
        test_router = APIRouter(prefix="/api/test-exceptions")

        class CustomTestDomainException(DomainException):
            def __init__(self):
                super().__init__(message="Error personalizado de prueba", status_code=418)

        @test_router.get("/fail")
        def trigger_failure():
            raise CustomTestDomainException()

        app.include_router(test_router)

        response = client.get("/api/test-exceptions/fail")

        assert response.status_code == 418
        data = response.json()
        assert data == {"error": "Error personalizado de prueba"}
