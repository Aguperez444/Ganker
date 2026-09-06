from pydantic import Field, BaseModel

class UpdateUserRequest(BaseModel):

    username: str = Field(..., description="The username of the player")

    name: str = Field(..., description="The name of the player")

    mail: str = Field(..., description="The email of the player")
