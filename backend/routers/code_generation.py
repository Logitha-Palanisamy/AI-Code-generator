"""Router for code generation endpoints."""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from backend.core.dependencies import get_db, get_current_user
from backend.core.logger import logger
from backend.models.user import User
from backend.models.ai_usage import AIUsageLog
from backend.services.code_generator import get_code_generator
from backend.schemas.code_generation import (
    CodeGenerationRequest,
    CodeGenerationResponse,
    CodeRefineRequest,
    CodeRefineResponse,
    MultiLanguageGenerationRequest,
)

router = APIRouter(prefix="/code-generation", tags=["Code Generation"])


@router.post("/generate", response_model=CodeGenerationResponse)
def generate_code(
    payload: CodeGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate code based on a natural language description.

    This endpoint uses Claude AI to generate production-ready code
    based on the provided description and programming language.
    """
    try:
        service = get_code_generator()

        # Generate code
        result = service.generate_code(
            description=payload.description,
            language=payload.language,
            framework=payload.framework,
        )

        # Log AI usage
        if result.get("success"):
            usage = AIUsageLog(
                user_id=current_user.id,
                provider="anthropic",
                model="claude-3-5-sonnet",
                stage="generate_code",
                input_tokens=len(payload.description.split()),
                output_tokens=len(result.get("code", "").split()),
            )
            db.add(usage)
            db.commit()
            logger.info(
                "Code generation logged",
                user_id=current_user.id,
                language=payload.language,
            )

        return result

    except Exception as e:
        logger.error(f"Error in code generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code generation failed: {str(e)}",
        )


@router.post("/refine", response_model=CodeRefineResponse)
def refine_code(
    payload: CodeRefineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Refine existing code based on feedback.

    This endpoint takes existing code and feedback to generate
    an improved version.
    """
    try:
        service = get_code_generator()

        # Refine code
        result = service.refine_code(
            code=payload.code,
            feedback=payload.feedback,
            language=payload.language,
        )

        # Log AI usage
        if result.get("success"):
            usage = AIUsageLog(
                user_id=current_user.id,
                provider="anthropic",
                model="claude-3-5-sonnet",
                stage="refine_code",
                input_tokens=len(payload.code.split()) + len(payload.feedback.split()),
                output_tokens=len(result.get("code", "").split()),
            )
            db.add(usage)
            db.commit()
            logger.info(
                "Code refinement logged",
                user_id=current_user.id,
                language=payload.language,
            )

        return result

    except Exception as e:
        logger.error(f"Error in code refinement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code refinement failed: {str(e)}",
        )


@router.post("/generate-multi")
def generate_multi_language(
    payload: MultiLanguageGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate code in multiple programming languages.

    This endpoint generates the same functionality in multiple
    languages for comparison and reuse.
    """
    try:
        service = get_code_generator()

        # Generate for multiple languages
        results = service.generate_multiple_implementations(
            description=payload.description,
            languages=payload.languages,
        )

        # Log AI usage
        total_output_tokens = 0
        for lang, result in results.items():
            if result.get("success"):
                total_output_tokens += len(result.get("code", "").split())

        if total_output_tokens > 0:
            usage = AIUsageLog(
                user_id=current_user.id,
                provider="anthropic",
                model="claude-3-5-sonnet",
                stage="generate_multi_language",
                input_tokens=len(payload.description.split()) * len(payload.languages),
                output_tokens=total_output_tokens,
            )
            db.add(usage)
            db.commit()
            logger.info(
                "Multi-language generation logged",
                user_id=current_user.id,
                languages=payload.languages,
            )

        return {
            "success": True,
            "results": results,
            "description": payload.description,
        }

    except Exception as e:
        logger.error(f"Error in multi-language generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-language generation failed: {str(e)}",
        )
