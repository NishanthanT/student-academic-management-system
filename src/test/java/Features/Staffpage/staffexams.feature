Feature: Staff exams page

  Scenario: Staff checks exams page functionality
    Given Staff navigate to the login page
    When Staff enters email and password
    And Staff clicks the sign in button
    Given Staff clicks exams navigation button

    When Staff clicks draft exams tab
    And Staff clicks pending exams tab
    And Staff clicks changes exams tab
    And Staff clicks approved exams tab
    And Staff clicks rejected exams tab
    Then Staff exam tabs should work successfully

    When Staff filters exams by subject
    And Staff filters exams by from date
    And Staff filters exams by to date
    And Staff searches exams
    And Staff clears exam filters
    Then Staff exam filters should work successfully

    When Staff refreshes exams page
    Then Staff exams refresh should work successfully

    When Staff opens create exam modal
    And Staff closes create exam modal
    Then Staff create exam modal should work successfully