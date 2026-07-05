"""Schemas for code generation endpoints."""

from pydantic import BaseModel, Field
from typing import Optional, List


class CodeGenerationRequest(BaseModel):
    """Request model for code generation."""

    description: str = Field(
        ..., min_length=10, description="Description of the code to generate"
    )
    language: str = Field(
        default="python", description="Programming language (python, javascript, java, etc.)"
    )
    framework: Optional[str] = Field(
        default=None, description="Optional framework (django, fastapi, react, etc.)"
    )

    class Config:
        example = {
            "description": "Create a web scraper that fetches weather data from a weather website",
            "language": "python",
            "framework": "None",
        }


class CodeGenerationResponse(BaseModel):
    """Response model for code generation."""

    success: bool
    filename: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    dependencies: Optional[List[str]] = None
    error: Optional[str] = None


class CodeRefineRequest(BaseModel):
    """Request model for code refinement."""

    code: str = Field(..., description="The code to refine")
    feedback: str = Field(..., description="Feedback or requirements for refinement")
    language: str = Field(default="python", description="Programming language")

    class Config:
        example = {
            "code": "def hello():\n    print('Hello')",
            "feedback": "Add type hints and docstrings",
            "language": "python",
        }


class CodeRefineResponse(BaseModel):
    """Response model for code refinement."""

    success: bool
    code: Optional[str] = None
    changes: Optional[str] = None
    language: Optional[str] = None
    error: Optional[str] = None


class MultiLanguageGenerationRequest(BaseModel):
    """Request model for generating code in multiple languages."""

    description: str = Field(..., description="Description of the code to generate")
    languages: List[str] = Field(
        default=["python", "javascript"],
        description="List of programming languages",
    )

    class Config:
        example = {
            "description": "Create a function to validate email addresses",
            "languages": ["python", "javascript", "java"],
        }
