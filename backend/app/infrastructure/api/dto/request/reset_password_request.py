from pydantic import BaseModel, Field


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=32, description="Token recibido por mail")
    # TODO Revisar las reglas de la contraseña
    new_password: str = Field(...,
                              min_length=8,
                              max_length=64,
                              description="Nueva contraseña")