Feature: Student login page

  Scenario: Student logs in with valid credentials
    Given Student navigate to the login page
    When Student enters email and password
    And Student clicks the sign in button
    Then Student should be redirected to the student dashboard