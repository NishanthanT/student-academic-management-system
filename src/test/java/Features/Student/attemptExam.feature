Feature: Student Attempt Exam Page

  Scenario: Student checks attempt exam page without subject dropdown
    Given Student navigate to the login page
    When Student enters email and password
    And Student clicks the sign in button
    Given Student clicks attempt exam navigation
    Then Attempt exam page should be displayed

    When Student checks available exams section
    Then Available exams section should work successfully

    When Student clicks first exam action button if enabled
    Then Password modal action should work successfully