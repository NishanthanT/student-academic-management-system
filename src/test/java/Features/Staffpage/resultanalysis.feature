Feature: Staff result analysis page

  Scenario: Staff checks result analysis page functionality
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Given Staff clicks result analysis navigation button
    When Staff selects subject in result analysis page
    And Staff selects exam in result analysis page
    Then Result analysis data should load successfully

    When Staff clicks download analysis report button if visible
    Then Result analysis actions should work successfully