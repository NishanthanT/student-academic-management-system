Feature: Admin mark edit requests page

  Scenario: Admin checks mark request filters
    Given Admin navigate to the login page
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Given Admin clicks mark requests navigation button
    When Admin selects all requests filter
    And Admin selects pending requests filter
    And Admin selects approved requests filter
    And Admin selects rejected requests filter
    Then Mark request filters should work successfully