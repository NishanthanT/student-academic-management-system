Feature: Staff allow students page

  Scenario: Staff checks allow students page functionality
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Given Staff clicks allow students navigation button

    When Staff filters allow students page by subject
    And Staff searches exams in allow students page
    And Staff clears allow students filters
    Then Allow students filters should work successfully

    When Staff refreshes allow students page
    Then Allow students refresh should work successfully

    When Staff clicks first manage students button
    Then Manage students modal should open successfully

    #When Staff closes manage students modal
    #Then Manage students modal should close successfully