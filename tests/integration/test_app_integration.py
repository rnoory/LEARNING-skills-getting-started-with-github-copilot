import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_activities():
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_get_activities_endpoint_returns_activity_list():
    # Given
    expected_activity_name = "Chess Club"

    # When
    response = client.get("/activities")

    # Then
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert expected_activity_name in data


def test_signup_for_activity_endpoint_succeeds():
    # Given
    activity_name = "Chess Club"
    email = "integrationstudent@mergington.edu"

    # When
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Then
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert email in activities[activity_name]["participants"]


def test_signup_for_activity_endpoint_returns_404_for_unknown_activity():
    # Given
    invalid_activity_name = "Magic Club"
    email = "student@mergington.edu"

    # When
    response = client.post(f"/activities/{invalid_activity_name}/signup", params={"email": email})

    # Then
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_for_activity_endpoint_returns_400_for_duplicate_signup():
    # Given
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]

    # When
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Then
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_unregister_from_activity_endpoint_succeeds():
    # Given
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]

    # When
    response = client.delete(f"/activities/{activity_name}/signup", params={"email": email})

    # Then
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from {activity_name}"}
    assert email not in activities[activity_name]["participants"]


def test_unregister_from_activity_endpoint_returns_404_for_unknown_activity():
    # Given
    invalid_activity_name = "Magic Club"
    email = "student@mergington.edu"

    # When
    response = client.delete(f"/activities/{invalid_activity_name}/signup", params={"email": email})

    # Then
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_from_activity_endpoint_returns_400_for_not_registered():
    # Given
    activity_name = "Chess Club"
    email = "notregistered@mergington.edu"

    # When
    response = client.delete(f"/activities/{activity_name}/signup", params={"email": email})

    # Then
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is not registered for this activity"
