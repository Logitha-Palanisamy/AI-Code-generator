from backend.models.setting import Setting

def test_register_user_success(client, db):
    """Verifies user registration, password hashing, and user setting creation."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "full_name": "Test User",
            "password": "password123",
            "confirm_password": "password123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data
    
    # Assert settings were automatically initialized
    user_settings = db.query(Setting).filter(Setting.user_id == data["id"]).first()
    assert user_settings is not None
    assert user_settings.theme == "dark"

def test_register_password_mismatch(client):
    """Verifies that registration fails if password and confirm_password differ."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "password123",
            "confirm_password": "differentpassword"
        }
    )
    assert response.status_code == 422 # Pydantic model validation error

def test_register_password_strength_error(client):
    """Verifies password strength criteria (digits and letters requirement)."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "password",  # Missing digits
            "confirm_password": "password"
        }
    )
    assert response.status_code == 422

def test_login_success_and_refresh_rotation(client):
    """Tests the login phase, access authentication, refresh flow, and token rotation security checks."""
    # 1. Register a test user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "username": "loginuser",
            "password": "password123",
            "confirm_password": "password123"
        }
    )
    
    # 2. Log in
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "loginuser",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in response.cookies
    refresh_cookie = response.cookies["refresh_token"]
    
    # 3. Request current user profile (/me)
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "loginuser"
    
    # 4. Refresh token rotation test
    refresh_resp = client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 200
    refresh_data = refresh_resp.json()
    assert "access_token" in refresh_data
    assert refresh_data["access_token"] != data["access_token"]
    assert "refresh_token" in refresh_resp.cookies
    new_refresh_cookie = refresh_resp.cookies["refresh_token"]
    assert new_refresh_cookie != refresh_cookie
    
    # 5. Replay attack: attempt to use the OLD refresh token
    client.cookies.set("refresh_token", refresh_cookie)
    replay_resp = client.post("/api/v1/auth/refresh")
    assert replay_resp.status_code == 401
    assert "please log in again" in replay_resp.json()["detail"]
    
    # 6. Verify that the current (new) refresh token was also revoked due to the replay detection
    client.cookies.set("refresh_token", new_refresh_cookie)
    subsequent_resp = client.post("/api/v1/auth/refresh")
    assert subsequent_resp.status_code == 401
