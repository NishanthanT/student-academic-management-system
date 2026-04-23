Feature: Staff my subjects page

  Scenario: Staff checks my subjects page and filters
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Given Staff clicks my subjects navigation button
    When Staff filters subjects by year
    And Staff filters subjects by semester
    And Staff searches subjects
    And Staff refreshes my subjects page
    Then My subjects filters should work successfully