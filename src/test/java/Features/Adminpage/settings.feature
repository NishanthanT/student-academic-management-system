Feature: Admin settings page

  Scenario: Admin updates system name, uploads logo, and toggles slider option
    Given Admin navigate to the login page
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Given Admin clicks settings navigation button
    When Admin updates system name
    And Admin uploads system logo
   # And Admin clicks temporary slider toggle
    And Admin clicks save settings button
    Then Settings should be saved successfully