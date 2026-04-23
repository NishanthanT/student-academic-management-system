Feature: Staff login page

  Scenario: Staff logs in with valid credentials
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Then Staff should be redirected to the staff dashboard