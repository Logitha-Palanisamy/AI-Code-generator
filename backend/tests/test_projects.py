import threading

from backend.models.project import Project
from backend.models.setting import Setting

def get_auth_headers(client):
    """Helper to register and login a test user, returning auth headers."""
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "projectuser@example.com",
            "username": "projectuser",
            "password": "password123",
            "confirm_password": "password123"
        }
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "projectuser",
            "password": "password123"
        }
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_project_and_list(client, db):
    """Verifies that projects can be created and listed for authenticated users."""
    headers = get_auth_headers(client)
    
    # 1. Create a project
    create_resp = client.post(
        "/api/v1/projects/",
        headers=headers,
        json={
            "requirement_text": "Build a simple weather scraper CLI app",
            "target_language": "Python"
        }
    )
    assert create_resp.status_code == 201
    proj_data = create_resp.json()
    assert proj_data["requirement_text"] == "Build a simple weather scraper CLI app"
    assert proj_data["target_language"] == "Python"
    assert "id" in proj_data
    
    # 2. Get project list
    list_resp = client.get("/api/v1/projects/", headers=headers)
    assert list_resp.status_code == 200
    projects = list_resp.json()
    assert len(projects) == 1
    assert projects[0]["id"] == proj_data["id"]

def test_create_project_without_trailing_slash_is_not_redirected(client, db):
    """Verifies that the no-slash project creation route works without an auth-dropping redirect."""
    headers = get_auth_headers(client)

    create_resp = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "requirement_text": "Build a simple CLI tool",
            "target_language": "Python"
        },
        follow_redirects=False,
    )

    assert create_resp.status_code == 201

def test_get_project_details(client, db):
    """Verifies retrieval of specific project records."""
    headers = get_auth_headers(client)
    
    # Create project
    create_resp = client.post(
        "/api/v1/projects/",
        headers=headers,
        json={
            "requirement_text": "Build a SQLite task manager script",
            "target_language": "Python"
        }
    )
    proj_id = create_resp.json()["id"]
    
    # Get project details
    detail_resp = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == proj_id

def test_delete_project(client, db):
    """Verifies project deletion removes records from database."""
    headers = get_auth_headers(client)
    
    # Create project
    create_resp = client.post(
        "/api/v1/projects/",
        headers=headers,
        json={
            "requirement_text": "Write a basic script to run calculations",
            "target_language": "Python"
        }
    )
    proj_id = create_resp.json()["id"]
    
    # Delete project
    delete_resp = client.delete(f"/api/v1/projects/{proj_id}", headers=headers)
    assert delete_resp.status_code == 200
    
    # Confirm it's gone
    confirm_resp = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert confirm_resp.status_code == 404

def test_create_project_starts_pipeline_without_celery(monkeypatch, client, db):
    """Verifies the project creation flow still kicks off the pipeline without a healthy Celery worker."""
    headers = get_auth_headers(client)
    start_event = threading.Event()

    def fake_run_pipeline(project_id: int):
        start_event.set()
        return True

    def fail_inspect(*args, **kwargs):
        raise RuntimeError("celery unavailable")

    monkeypatch.setattr("backend.jobs.celery_app.celery_app.control.inspect", fail_inspect)
    monkeypatch.setattr("backend.jobs.orchestrator.run_pipeline", fake_run_pipeline)

    create_resp = client.post(
        "/api/v1/projects/",
        headers=headers,
        json={
            "requirement_text": "Build a simple CLI tool",
            "target_language": "Python"
        }
    )

    assert create_resp.status_code == 201
    assert start_event.wait(timeout=2)


def test_settings_retrieval_and_update(client, db):
    """Verifies that user settings can be retrieved and updated."""
    headers = get_auth_headers(client)
    
    # Get default settings
    get_resp = client.get("/api/v1/settings/", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["theme"] == "dark"
    
    # Update settings
    update_resp = client.put(
        "/api/v1/settings/",
        headers=headers,
        json={
            "theme": "light",
            "preferred_model": "claude-3-haiku",
            "timeout_seconds": 120,
            "personal_api_key": "sk-ant-test-key-override-12345"
        }
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["theme"] == "light"
    assert updated_data["preferred_model"] == "claude-3-haiku"
    assert updated_data["timeout_seconds"] == 120
