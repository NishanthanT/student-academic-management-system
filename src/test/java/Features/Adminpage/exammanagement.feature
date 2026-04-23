Feature: Admin exam management page

  Scenario: Admin checks exam management tabs and filters
    Given Admin navigate to the login page
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Given Admin clicks exam management navigation button

    When Admin clicks pending tab
    And Admin clicks changes tab
    And Admin clicks approved tab
    And Admin clicks rejected tab
    Then Exam status tabs should work successfully

    When Admin filters exams by subject
    And Admin filters exams by date
    And Admin searches exams
    And Admin clears exam filters
    Then Exam filters should work successfully

    When Admin refreshes exam management page
    Then Exam management refresh should work successfully