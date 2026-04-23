Feature: Admin assign staff to subject page

  Scenario: Admin checks assign staff page full functionality
    Given Admin navigate to the login page
    And Admin enters valid email and valid password
    And Admin clicks the login button
    Given Admin clicks assign staff navigation button

    When Admin filters subjects in assignment panel
    And Admin searches subject in assignment panel
    And Admin selects a subject in assignment panel
    And Admin searches staff in assignment panel
    And Admin selects staff members in assignment panel
    And Admin clicks assign staff button
    Then Staff should be assigned successfully

    When Admin refreshes assigned staff section
    #And Admin removes one assigned staff member
    Then Assigned staff should be removed successfully

    When Admin filters all assignments table
    And Admin refreshes all assignments table
    And Admin edits first assignment row
    Then Assignment should be updated successfully

    When Admin deletes first assignment row
    Then Assignment should be deleted successfully