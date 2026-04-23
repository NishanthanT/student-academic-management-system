Feature: Student dashboard page

  Scenario: Student checks dashboard full scrolling
    Given Student navigate to the login page
    When Student enters email and password
    And Student clicks the sign in button
    Given Student navigates to the dashboard page
    When Student scrolls down the dashboard page fully
    And Student scrolls up the dashboard page fully
    Then Student dashboard scrolling should work successfully