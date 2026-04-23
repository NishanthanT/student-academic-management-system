Feature: Admin login page

  Scenario: Admin tests invalid and valid login then downloads pdf
    Given Admin navigate to the login page

    When Admin enters invalid email and valid password
    And Admin clicks the login button
    Then Invalid credentials message should be displayed

    When Admin clears the login fields
    And Admin enters valid email and invalid password
    And Admin clicks the login button
    Then Invalid credentials message should be displayed

    When Admin clears the login fields
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Then Admin should be redirected to the admin dashboard

    When Admin clicks the export pdf button
   # Then Admin pdf should be downloaded successfully