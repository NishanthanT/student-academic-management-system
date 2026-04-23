Feature: Staff results page

  Scenario: Staff checks results page functionality
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Given Staff clicks results navigation button

    When Staff changes subject in results page
    And Staff changes exam in results page
    And Staff enters student email in results page
    And Staff clicks apply button in results page
    And Staff clicks clear button in results page
    Then Results filters should work successfully

    When Staff opens view modal in results page
    And Staff closes view modal in results page
    Then Results view modal should work successfully

    When Staff opens edit modal in results page
    And Staff closes edit modal in results page
    Then Results edit modal should work successfully

    When Staff clicks download results pdf button if visible
    Then Results page actions should work successfully