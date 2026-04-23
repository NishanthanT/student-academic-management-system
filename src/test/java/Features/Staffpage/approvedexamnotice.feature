Feature: Staff approved exam notice page

  Scenario: Staff checks approved exam notice page functionality
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Given Staff clicks approved exam notice navigation button

    When Staff filters approved exams by subject
    And Staff searches approved exams
    And Staff clears approved exam filters
    Then Approved exam filters should work successfully

    When Staff refreshes approved exam notice page
    Then Approved exam notice refresh should work successfully

    When Staff clicks first approved exam action button
    Then Questions page should open successfully

    When Staff clicks back to approved notice button
    Then Approved exam notice page should open successfully again