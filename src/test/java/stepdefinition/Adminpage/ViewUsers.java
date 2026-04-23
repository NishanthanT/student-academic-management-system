package stepdefinition.Adminpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Adminpage.ViewUsers.*;

public class ViewUsers {

    @Given("Admin clicks view users navigation button")
    public void adminClicksViewUsersNavigationButton() throws InterruptedException {
        clickViewUsersNavigationButton();
    }

    @When("Admin clicks all users tab")
    public void adminClicksAllUsersTab() throws InterruptedException {
        clickAllUsersTab();
    }

    @When("Admin clicks first row edit button")
    public void adminClicksFirstRowEditButton() throws InterruptedException {
        clickFirstRowEditButton();
    }

    @When("Admin changes first row user name and saves")
    public void adminChangesFirstRowUserNameAndSaves() throws InterruptedException {
        changeFirstRowUserNameAndSave();
    }

    @Then("User should be updated successfully")
    public void userShouldBeUpdatedSuccessfully() {
        String toastMessage = getToastMessage();
        Assert.assertTrue("Update success toast not shown",
                toastMessage.toLowerCase().contains("updated"));
        System.out.println("User updated successfully");
    }

    @When("Admin clicks first row delete button")
    public void adminClicksFirstRowDeleteButton() throws InterruptedException {
        clickFirstRowDeleteButton();
    }

    @Then("Delete confirm button should be disabled without reason")
    public void deleteConfirmButtonShouldBeDisabledWithoutReason() {
        Assert.assertTrue("Delete button should be disabled without reason",
                isDeleteConfirmButtonDisabled());
        System.out.println("Delete button disabled check successful");
    }

    @When("Admin enters delete reason and confirms delete")
    public void adminEntersDeleteReasonAndConfirmsDelete() throws InterruptedException {
        enterDeleteReasonAndConfirmDelete();
    }

    @Then("User should be deleted successfully")
    public void userShouldBeDeletedSuccessfully() {
        String toastMessage = getToastMessage();
        Assert.assertTrue("Delete success toast not shown",
                toastMessage.toLowerCase().contains("deleted"));
        System.out.println("User deleted successfully");
    }

    @When("Admin clicks all users filter")
    public void adminClicksAllUsersFilter() throws InterruptedException {
        clickAllUsersFilter();
    }

    @When("Admin clicks admins filter")
    public void adminClicksAdminsFilter() throws InterruptedException {
        clickAdminsFilter();
    }

    @When("Admin clicks staff filter")
    public void adminClicksStaffFilter() throws InterruptedException {
        clickStaffFilter();
    }

    @When("Admin clicks students filter")
    public void adminClicksStudentsFilter() throws InterruptedException {
        clickStudentsFilter();
    }

    @Then("All user filters should be viewed successfully")
    public void allUserFiltersShouldBeViewedSuccessfully() {
        System.out.println("All filters viewed successfully");
    }
}