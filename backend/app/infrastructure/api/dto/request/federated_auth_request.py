from typing import Dict, Optional

from pydantic import BaseModel, EmailStr, Field


class FederatedCallbackRequest(BaseModel):
    state: str = Field(..., min_length=1, description="Parámetro state firmado para protección contra CSRF")
    code: Optional[str] = Field(None, description="Código de autorización devuelto por proveedores OAuth2")
    openid_params: Optional[Dict[str, str]] = Field(
        None,
        description="Parámetros openid.* devueltos por proveedores OpenID 2.0 como Steam",
    )


class CompleteFederatedRegistrationRequest(BaseModel):
    registration_token: str = Field(..., min_length=1, description="Token firmado con la identidad federada verificada")
    username: str = Field(..., min_length=1, max_length=40, description="Nombre de usuario elegido por el jugador")
    name: str = Field(..., min_length=1, max_length=80, description="Nombre completo elegido por el jugador")
    mail: Optional[EmailStr] = Field(None, description="Correo electrónico del jugador (opcional si el proveedor no lo informa)")
