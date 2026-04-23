Feature: Student Exam Notice Page

  Scenario: Student views exam notices and interacts
    Given Student navigate to the login page
    When Student enters email and password
    And Student clicks the sign in button
    Given Student clicks exam notice navigation
    Then Exam notice page should be displayed

    When Student selects subject filter
    And Student selects exam from dropdown
    And Student clicks view button
    Then Exam notice modal should be displayed

    When Student closes the modal
    And Student clicks refresh button