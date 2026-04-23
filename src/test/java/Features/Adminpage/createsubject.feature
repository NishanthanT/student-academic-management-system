Feature: Admin create subject page

  Scenario: Admin creates, edits, deletes, and filters subjects
    Given Admin navigate to the login page
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Given Admin clicks create subject navigation button
    When Admin enters new subject details
    And Admin clicks create subject submit button
    Then Subject should be created successfully

    When Admin clicks first row subject edit button
    And Admin changes first row subject name and saves
    Then Subject should be updated successfully

    When Admin clicks first row subject delete button
    And Admin confirms subject delete
    Then Subject should be deleted successfully

    When Admin filters subjects by year and semester
    Then Subject filters should work successfully