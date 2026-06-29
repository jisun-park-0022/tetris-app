"""POST /scores, GET /scores/me, GET /scores/leaderboard 엔드포인트 테스트"""


def _register_and_login(client, email, password="password123"):
    """테스트용 헬퍼: 회원가입 후 Bearer 헤더 반환"""
    client.post("/auth/register", json={"email": email, "password": password})
    token = client.post("/auth/login", json={"email": email, "password": password}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestSaveScore:
    def test_save_score_success(self, client, auth_headers):
        response = client.post("/scores", json={"score": 1500}, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["score"] == 1500
        assert "id" in data
        assert "created_at" in data

    def test_save_score_zero(self, client, auth_headers):
        response = client.post("/scores", json={"score": 0}, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["score"] == 0

    def test_save_multiple_scores_for_same_user(self, client, auth_headers):
        for score in [100, 200, 300]:
            r = client.post("/scores", json={"score": score}, headers=auth_headers)
            assert r.status_code == 201

    def test_save_score_unauthenticated_returns_403(self, client):
        response = client.post("/scores", json={"score": 1000})
        assert response.status_code == 403

    def test_save_score_invalid_token_returns_401(self, client):
        response = client.post("/scores", json={"score": 1000}, headers={
            "Authorization": "Bearer invalid.token",
        })
        assert response.status_code == 401

    def test_save_score_missing_body_returns_422(self, client, auth_headers):
        response = client.post("/scores", json={}, headers=auth_headers)
        assert response.status_code == 422

    def test_save_score_non_integer_returns_422(self, client, auth_headers):
        response = client.post("/scores", json={"score": "not-a-number"}, headers=auth_headers)
        assert response.status_code == 422


class TestMyScores:
    def test_my_scores_empty_when_no_records(self, client, auth_headers):
        response = client.get("/scores/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_my_scores_returns_own_records(self, client, auth_headers):
        client.post("/scores", json={"score": 100}, headers=auth_headers)
        client.post("/scores", json={"score": 300}, headers=auth_headers)
        client.post("/scores", json={"score": 200}, headers=auth_headers)

        response = client.get("/scores/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_my_scores_ordered_by_score_descending(self, client, auth_headers):
        for score in [100, 500, 200, 400, 300]:
            client.post("/scores", json={"score": score}, headers=auth_headers)

        response = client.get("/scores/me", headers=auth_headers)
        scores = [r["score"] for r in response.json()]
        assert scores == sorted(scores, reverse=True)

    def test_my_scores_limited_to_10(self, client, auth_headers):
        for i in range(15):
            client.post("/scores", json={"score": i * 100}, headers=auth_headers)

        response = client.get("/scores/me", headers=auth_headers)
        assert len(response.json()) == 10

    def test_my_scores_only_own_user(self, client):
        # 두 사용자가 각자의 점수만 조회할 수 있어야 한다
        h1 = _register_and_login(client, "user1@example.com")
        h2 = _register_and_login(client, "user2@example.com")

        client.post("/scores", json={"score": 999}, headers=h1)
        client.post("/scores", json={"score": 888}, headers=h2)

        r1 = client.get("/scores/me", headers=h1).json()
        r2 = client.get("/scores/me", headers=h2).json()

        assert len(r1) == 1 and r1[0]["score"] == 999
        assert len(r2) == 1 and r2[0]["score"] == 888

    def test_my_scores_unauthenticated_returns_403(self, client):
        response = client.get("/scores/me")
        assert response.status_code == 403

    def test_my_scores_invalid_token_returns_401(self, client):
        response = client.get("/scores/me", headers={
            "Authorization": "Bearer bad.token",
        })
        assert response.status_code == 401


class TestLeaderboard:
    def test_leaderboard_empty_when_no_scores(self, client):
        response = client.get("/scores/leaderboard")
        assert response.status_code == 200
        assert response.json() == []

    def test_leaderboard_no_auth_required(self, client):
        # 리더보드는 인증 없이 조회 가능해야 한다
        response = client.get("/scores/leaderboard")
        assert response.status_code == 200

    def test_leaderboard_shows_best_score_per_user(self, client):
        # 한 사용자가 여러 점수를 기록해도 최고점 하나만 집계되어야 한다
        headers = _register_and_login(client, "player@example.com")
        for score in [100, 500, 200]:
            client.post("/scores", json={"score": score}, headers=headers)

        response = client.get("/scores/leaderboard")
        data = response.json()
        assert len(data) == 1
        assert data[0]["best_score"] == 500

    def test_leaderboard_ranking_is_correct(self, client):
        users = [
            ("alice@example.com", [300, 100]),
            ("bob@example.com",   [500]),
            ("charlie@example.com", [200, 400]),
        ]
        for email, scores in users:
            h = _register_and_login(client, email)
            for s in scores:
                client.post("/scores", json={"score": s}, headers=h)

        data = client.get("/scores/leaderboard").json()

        # bob=500, charlie=400, alice=300 순으로 정렬
        assert len(data) == 3
        assert data[0]["email"] == "bob@example.com"
        assert data[0]["best_score"] == 500
        assert data[0]["rank"] == 1
        assert data[1]["email"] == "charlie@example.com"
        assert data[1]["best_score"] == 400
        assert data[1]["rank"] == 2
        assert data[2]["email"] == "alice@example.com"
        assert data[2]["best_score"] == 300
        assert data[2]["rank"] == 3

    def test_leaderboard_rank_field_is_sequential(self, client):
        for i in range(3):
            h = _register_and_login(client, f"u{i}@example.com")
            client.post("/scores", json={"score": (i + 1) * 100}, headers=h)

        data = client.get("/scores/leaderboard").json()
        ranks = [entry["rank"] for entry in data]
        assert ranks == list(range(1, len(ranks) + 1))

    def test_leaderboard_limited_to_10(self, client):
        for i in range(12):
            h = _register_and_login(client, f"player{i}@example.com")
            client.post("/scores", json={"score": i * 100}, headers=h)

        data = client.get("/scores/leaderboard").json()
        assert len(data) == 10

    def test_leaderboard_users_with_no_scores_excluded(self, client):
        # 점수 없는 사용자는 리더보드에 표시되지 않아야 한다
        client.post("/auth/register", json={"email": "noscore@example.com", "password": "password123"})

        h = _register_and_login(client, "withscore@example.com")
        client.post("/scores", json={"score": 100}, headers=h)

        data = client.get("/scores/leaderboard").json()
        emails = [e["email"] for e in data]
        assert "withscore@example.com" in emails
        assert "noscore@example.com" not in emails

    def test_leaderboard_response_schema(self, client):
        h = _register_and_login(client, "schema@example.com")
        client.post("/scores", json={"score": 999}, headers=h)

        data = client.get("/scores/leaderboard").json()
        entry = data[0]
        assert set(entry.keys()) == {"rank", "email", "best_score"}
        assert isinstance(entry["rank"], int)
        assert isinstance(entry["email"], str)
        assert isinstance(entry["best_score"], int)
