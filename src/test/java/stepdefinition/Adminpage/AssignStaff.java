package stepdefinition.Adminpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Adminpage.AssignStaff.*;

public class AssignStaff {

    @Given("Admin clicks assign staff navigation button")
    public void adminClicksAssignStaffNavigationButton() throws InterruptedException {
        clickAssignStaffNavigationButton();
    }

    @When("Admin filters subjects in assignment panel")
    public void adminFiltersSubjectsInAssignmentPanel() throws InterruptedException {
        filterSubjectsInAssignmentPanel();
    }

    @When("Admin searches subject in assignment panel")
    public void adminSearchesSubjectInAssignmentPanel() throws InterruptedException {
        searchSubjectInAssignmentPanel();
    }

    @When("Admin selects a subject in assignment panel")
    public void adminSelectsASubjectInAssignmentPanel() throws InterruptedException {
        selectSubjectInAssignmentPanel();
    }

    @When("Admin searches staff in assignment panel")
    public void adminSearchesStaffInAssignmentPanel() throws InterruptedException {
        searchStaffInAssignmentPanel();
    }

    @When("Admin selects staff members in assignment panel")
    public void adminSelectsStaffMembersInAssignmentPanel() throws InterruptedException {
        selectStaffMembersInAssignmentPanel();
    }

    @When("Admin clicks assign staff button")
    public void adminClicksAssignStaffButton() throws InterruptedException {
        clickAssignStaffButton();
    }

    @Then("Staff should be assigned successfully")
    public void staffShouldBeAssignedSuccessfully() {
        Assert.assertTrue("Staff was not assigned successfully", isStaffAssignedSuccessfully());
        System.out.println("Staff assigned successfully");
    }

    @When("Admin refreshes assigned staff section")
    public void adminRefreshesAssignedStaffSection() throws InterruptedException {
        refreshAssignedStaffSection();
    }

    @When("Admin removes one assigned staff member")
    public void adminRemovesOneAssignedStaffMember() throws InterruptedException {
        removeOneAssignedStaffMember();
    }

    @Then("Assigned staff should be removed successfully")
    public void assignedStaffShouldBeRemovedSuccessfully() {
        Assert.assertTrue("Assigned staff was not removed successfully", isAssignedStaffRemovedSuccessfully());
        System.out.println("Assigned staff removed successfully");
    }

    @When("Admin filters all assignments table")
    public void adminFiltersAllAssignmentsTable() throws InterruptedException {
        filterAllAssignmentsTable();
    }

    @When("Admin refreshes all assignments table")
    public void adminRefreshesAllAssignmentsTable() throws InterruptedException {
        refreshAllAssignmentsTable();
    }

    @When("Admin edits first assignment row")
    public void adminEditsFirstAssignmentRow() throws InterruptedException {
        editFirstAssignmentRow();
    }

    @Then("Assignment should be updated successfully")
    public void assignmentShouldBeUpdatedSuccessfully() {
        Assert.assertTrue("Assignment was not updated successfully", isAssignmentUpdatedSuccessfully());
        System.out.println("Assignment updated successfully");
    }

    @When("Admin deletes first assignment row")
    public void adminDeletesFirstAssignmentRow() throws InterruptedException {
        deleteFirstAssignmentRow();
    }

    @Then("Assignment should be deleted successfully")
    public void assignmentShouldBeDeletedSuccessfully() {
        Assert.assertTrue("Assignment was not deleted successfully", isAssignmentDeletedSuccessfully());
        System.out.println("Assignment deleted successfully");
    }
}