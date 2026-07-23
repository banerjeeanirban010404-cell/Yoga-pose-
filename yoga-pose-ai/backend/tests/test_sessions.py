def test_log_and_list_sessions(client):
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
    headers = {"Authorization": f"Bearer {token}"}

    # Log a session
    session_payload = {
      "pose_id": "tree-pose",
      "pose_name": "Tree Pose",
      "accuracy": 92.5,
      "duration": 60,
      "calories": 6.0,
      "xp_earned": 50,
      "is_flow": False
    }
    response = client.post(
        "/api/v1/sessions",
        json=session_payload,
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["pose_id"] == "tree-pose"
    assert data["accuracy"] == 92.5
    assert data["xp_earned"] == 50

    # Retrieve sessions
    response = client.get("/api/v1/sessions", headers=headers)
    assert response.status_code == 200
    sessions_list = response.json()
    assert len(sessions_list) == 1
    assert sessions_list[0]["pose_id"] == "tree-pose"

def test_dashboard_aggregation(client):
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
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve dashboard (should have default metrics seeded + 0 active weekly completed)
    response = client.get("/api/v1/dashboard", headers=headers)
    assert response.status_code == 200
    dash_data = response.json()
    assert dash_data["stats"]["activeStreak"] == 5  # default streak
    assert dash_data["stats"]["weeklyCompleted"] == 0

    # Log a session (duration: 120s = 2 mins)
    client.post(
        "/api/v1/sessions",
        json={
          "pose_id": "tree-pose",
          "pose_name": "Tree Pose",
          "accuracy": 90.0,
          "duration": 120,
          "calories": 12.0,
          "xp_earned": 100,
          "is_flow": False
        },
        headers=headers
    )

    # Check dashboard aggregates again
    response = client.get("/api/v1/dashboard", headers=headers)
    assert response.status_code == 200
    dash_data = response.json()
    assert dash_data["stats"]["weeklyCompleted"] == 2  # 2 minutes of practice this week
    assert dash_data["stats"]["averageAccuracy"] == 90
    assert len(dash_data["sessionHistory"]) == 1

def test_unified_library_endpoint_and_nlm_search(client, db):
    from app.services.yoga_service import yoga_service
    yoga_service.seed_initial_data(db)
    
    # Retrieve complete library (poses & exercises combined) without queries
    response = client.get("/api/v1/library")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    results = data["results"]
    assert len(results) > 0
    assert all("type" in item and "category" in item for item in results)
    
    # NLM search test: query "back pain" (should trigger Cobra Pose or spinal stretching)
    response = client.get("/api/v1/library?q=back%20pain")
    assert response.status_code == 200
    search_data = response.json()
    search_results = search_data["results"]
    assert len(search_results) > 0
    assert any("cobra" in item["id"] or "dog" in item["id"] for item in search_results)

    # NLM search test: query "calm and breathe" (should match Pranayama/breathing warm-up)
    response = client.get("/api/v1/library?q=calm%20and%20breathe")
    assert response.status_code == 200
    breathing_search = response.json()
    breathing_results = breathing_search["results"]
    assert len(breathing_results) > 0
    assert any("breath" in item["id"] for item in breathing_results)

