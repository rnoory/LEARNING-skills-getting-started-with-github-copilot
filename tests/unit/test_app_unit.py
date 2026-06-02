import copy

import pytest
from fastapi import HTTPException

from src.app import activities, get_activities, signup_for_activity, unregister_from_activity


@pytest.fixture(autouse=True)
def restore_activities():
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_get_activities_returns_activity_mapping():
    # Given
    expected_activity_name = "Chess Club"

    # When
    result = get_activities()

    # Then
    assert isinstance(result, dict)
    assert expected_activity_name in result
    assert result[expected_activity_name]["max_participants"] == 12


def test_signup_for_activity_adds_participant():
    # Given
    activity_name = "Chess Club"
    email = "unitstudent@mergington.edu"
    assert email not in activities[activity_name]["participants"]

    # When
    result = signup_for_activity(activity_name, email)

    # Then
    assert result == {"message": f"Signed up {email} for {activity_name}"}
    assert email in activities[activity_name]["participants"]


def test_signup_for_activity_raises_404_for_unknown_activity():
    # Given
    invalid_activity_name = "Magic Club"
    email = "student@mergington.edu"

    # When / Then
    with pytest.raises(HTTPException) as exc_info:
        signup_for_activity(invalid_activity_name, email)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Activity not found"


def test_signup_for_activity_raises_400_for_duplicate_signup():
    # Given
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]

    # When / Then
    with pytest.raises(HTTPException) as exc_info:
        signup_for_activity(activity_name, email)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Student already signed up for this activity"


def test_unregister_from_activity_removes_participant():
    # Given
    activity_name = "Chess Club"
    email = activities[activity_name]["participants"][0]
    assert email in activities[activity_name]["participants"]

    # When
    result = unregister_from_activity(activity_name, email)

    # Then
    assert result == {"message": f"Unregistered {email} from {activity_name}"}
    assert email not in activities[activity_name]["participants"]


def test_unregister_from_activity_raises_404_for_unknown_activity():
    # Given
    invalid_activity_name = "Magic Club"
    email = "student@mergington.edu"

    # When / Then
    with pytest.raises(HTTPException) as exc_info:
        unregister_from_activity(invalid_activity_name, email)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Activity not found"


def test_unregister_from_activity_raises_400_for_not_registered():
    # Given
    activity_name = "Chess Club"
    email = "notregistered@mergington.edu"
    assert email not in activities[activity_name]["participants"]

    # When / Then
    with pytest.raises(HTTPException) as exc_info:
        unregister_from_activity(activity_name, email)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Student is not registered for this activity"
