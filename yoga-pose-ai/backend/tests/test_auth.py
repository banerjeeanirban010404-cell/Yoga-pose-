def test_register_user(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={"username": "yogafan", "email": "yoga@fan.com", "password": "securepassword"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "yogafan"
    assert data["email"] == "yoga@fan.com"
    assert "id" in data

def test_register_duplicate_username(client):
    # Register first user
    client.post(
        "/api/v1/auth/signup",
        json={"username": "yogafan", "email": "yoga@fan.com", "password": "securepassword"}
    )
    # Try duplicate username
    response = client.post(
        "/api/v1/auth/signup",
        json={"username": "yogafan", "email": "different@fan.com", "password": "securepassword"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_user(client):
    # Register
    client.post(
        "/api/v1/auth/signup",
        json={"username": "yogafan", "email": "yoga@fan.com", "password": "securepassword"}
    )
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "yoga@fan.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_user_incorrect_password(client):
    # Register
    client.post(
        "/api/v1/auth/signup",
        json={"username": "yogafan", "email": "yoga@fan.com", "password": "securepassword"}
    )
    # Login with bad pass
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "yoga@fan.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]

def test_get_me(client):
    # Register & Login
    client.post(
        "/api/v1/auth/signup",
        json={"username": "yogafan", "email": "yoga@fan.com", "password": "securepassword"}
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "yoga@fan.com", "password": "securepassword"}
    )
    token = login_response.json()["access_token"]
    
    # Get profile
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "yogafan"
