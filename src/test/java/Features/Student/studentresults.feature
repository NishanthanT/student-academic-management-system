Feature: Student Results Page

  Scenario: Student checks results page
    Given Student navigate to the login page
    When Student enters email and password
    And Student clicks the sign in button
    Given Student clicks view results navigation
    Then Student results page should be displayed

    When Student changes subject in results page
    And Student changes exam in results page
    Then Student results data should load successfully