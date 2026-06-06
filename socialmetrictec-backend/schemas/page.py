from pydantic import BaseModel,ConfigDict
from typing import Dict, Any
class Block(BaseModel):
    type: str 
    props: Dict[str, Any] 
    model_config = ConfigDict(from_attributes=True)
class Page(BaseModel):
    blocks : list[Block]
    general_props: Dict[str,Any]
    model_config = ConfigDict(from_attributes=True)