Feature: Student Feedback Page

  Scenario: Student checks feedback page and submits feedback
    Given Student navigate to the login page
    When Student enters email and password
    And Student clicks the sign in button
    Given Student clicks feedback navigation
    Then Student feedback page should be displayed

    When Student selects subject in feedback page
    And Student selects staff in feedback page
    And Student enters message in feedback page
    And Student clicks submit feedback button
    Then Student feedback action should work successfully