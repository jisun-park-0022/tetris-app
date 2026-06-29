"""POST /auth/register, POST /auth/login, GET /auth/me 엔드포인트 테스트"""


class TestRegister:
    def test_register_success(self, client):
        response = client.post("/auth/register", json={
            "email": "new@example.com",
            "password": "password123",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "new@example.com"
        assert "id" in data
        assert "created_at" in data
        # 해시된 비밀번호는 응답에 포함되지 않아야 한다
        assert "hashed_password" not in data
        assert "password" not in data

    def test_register_duplicate_email(self, client, registered_user):
        response = client.post("/auth/register", json={
            "email": registered_user["email"],
            "password": "anotherpassword",
        })
        assert response.status_code == 400
        assert "이미 사용 중인" in response.json()["detail"]

    def test_register_password_too_short(self, client):
        response = client.post("/auth/register", json={
            "email": "short@example.com",
            "password": "12345",  # 5자 → 거부
        })
        assert response.status_code == 400
        assert "6자" in response.json()["detail"]

    def test_register_password_exactly_6_chars(self, client):
        response = client.post("/auth/register", json={
            "email": "exact@example.com",
            "password": "123456",  # 정확히 6자 → 허용
        })
        assert response.status_code == 201

    def test_register_invalid_email_format(self, client):
        response = client.post("/auth/register", json={
            "email": "not-an-email",
            "password": "password123",
        })
        assert response.status_code == 422

    def test_register_missing_email(self, client):
        response = client.post("/auth/register", json={"password": "password123"})
        assert response.status_code == 422

    def test_register_missing_password(self, client):
        response = client.post("/auth/register", json={"email": "user@example.com"})
        assert response.status_code == 422

    def test_register_empty_body(self, client):
        response = client.post("/auth/register", json={})
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client, registered_user):
        response = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0

    def test_login_wrong_password(self, client, registered_user):
        response = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": "wrong_password",
        })
        assert response.status_code == 401
        assert "비밀번호" in response.json()["detail"]

    def test_login_nonexistent_email(self, client):
        response = client.post("/auth/login", json={
            "email": "nobody@example.com",
            "password": "password123",
        })
        assert response.status_code == 401

    def test_login_invalid_email_format(self, client):
        response = client.post("/auth/login", json={
            "email": "not-an-email",
            "password": "password123",
        })
        assert response.status_code == 422

    def test_login_missing_fields(self, client):
        response = client.post("/auth/login", json={"email": "user@example.com"})
        assert response.status_code == 422

    def test_login_token_is_valid_jwt(self, client, registered_user):
        from jose import jwt as jose_jwt
        from auth import SECRET_KEY, ALGORITHM

        response = client.post("/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        token = response.json()["access_token"]
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == registered_user["email"]


class TestMe:
    def test_me_returns_current_user(self, client, registered_user, auth_headers):
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registered_user["email"]
        assert "id" in data
        assert "created_at" in data
        assert "hashed_password" not in data

    def test_me_no_token_returns_403(self, client):
        # HTTPBearer는 Authorization 헤더 없으면 403 반환
        response = client.get("/auth/me")
        assert response.status_code == 403

    def test_me_invalid_token_returns_401(self, client):
        response = client.get("/auth/me", headers={
            "Authorization": "Bearer this.is.invalid",
        })
        assert response.status_code == 401

    def test_me_wrong_scheme_returns_403(self, client):
        response = client.get("/auth/me", headers={
            "Authorization": "Basic dXNlcjpwYXNz",
        })
        assert response.status_code == 403

    def test_me_expired_token_returns_401(self, client, registered_user):
        from datetime import timedelta
        from auth import create_access_token

        # 이미 만료된 토큰 생성 (음수 만료)
        expired_token = create_access_token(
            {"sub": registered_user["email"]},
            expires_delta=timedelta(seconds=-1),
        )
        response = client.get("/auth/me", headers={
            "Authorization": f"Bearer {expired_token}",
        })
        assert response.status_code == 401

    def test_me_token_without_sub_returns_401(self, client):
        from auth import create_access_token

        token = create_access_token({"data": "no_sub_field"})
        response = client.get("/auth/me", headers={
            "Authorization": f"Bearer {token}",
        })
        assert response.status_code == 401
