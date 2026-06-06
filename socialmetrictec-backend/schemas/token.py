from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

# Opcional: si quieres que Swagger sepa qué datos viajan dentro
class TokenData(BaseModel):
    username: str | None = None