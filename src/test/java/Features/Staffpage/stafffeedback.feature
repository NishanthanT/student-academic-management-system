Feature: Staff feedback page

  Scenario: Staff checks feedback page functionality
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Given Staff clicks feedback navigation button
    When Staff clicks first feedback action button
    Then Staff feedback action should work successfully