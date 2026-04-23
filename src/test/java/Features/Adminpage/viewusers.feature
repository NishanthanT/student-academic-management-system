Feature: Admin view users page

  Scenario: Admin edits, deletes, and filters users
    Given Admin navigate to the login page
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Given Admin clicks view users navigation button
    When Admin clicks all users tab
    And Admin clicks first row edit button
    And Admin changes first row user name and saves
    Then User should be updated successfully

    When Admin clicks first row delete button
    Then Delete confirm button should be disabled without reason

    When Admin enters delete reason and confirms delete
    Then User should be deleted successfully

    When Admin clicks all users filter
    And Admin clicks admins filter
    And Admin clicks staff filter
    And Admin clicks students filter
    Then All user filters should be viewed successfully