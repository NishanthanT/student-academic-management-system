Feature: Staff dashboard page

  Scenario: Staff checks dashboard scrolling
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Given Staff clicks dashboard navigation button
    When Staff scrolls down the dashboard page
    And Staff scrolls up the dashboard page
    Then Staff dashboard scrolling should work successfully