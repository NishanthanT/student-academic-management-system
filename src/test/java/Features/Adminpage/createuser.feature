Feature: Admin create user page

  Scenario: Admin creates a new staff user
    Given Admin navigate to the login page
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Given Admin clicks create user navigation button
    When Admin enters new staff user details
    And Admin clicks create user submit button
    Then Staff user should be created successfully

  Scenario: Admin creates a new student user
    Given Admin navigate to the login page
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Given Admin clicks create user navigation button
    When Admin enters new student user details
    And Admin clicks create user submit button
    Then Student user should be created successfully