from pathlib import Path

from backend.jobs.orchestrator import generate_project_artifacts


def test_generate_project_artifacts_creates_language_specific_source(tmp_path: Path):
    project_id = 42
    requirement_text = "Build a weather CLI app"

    created_files = generate_project_artifacts(
        project_id=project_id,
        requirement_text=requirement_text,
        target_language="Python",
        workspace_root=tmp_path,
    )

    assert len(created_files) >= 1
    generated_file = tmp_path / "generated_projects" / str(project_id) / "main.py"
    assert generated_file.exists()
    content = generated_file.read_text(encoding="utf-8")
    assert "weather" in content.lower()
    assert "def main" in content
