package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.AllowStudents.*;

public class AllowStudents {

    @Given("Staff clicks allow students navigation button")
    public void staffClicksAllowStudentsNavigationButton() throws InterruptedException {
        clickAllowStudentsNavigationButton();
    }

    @When("Staff filters allow students page by subject")
    public void staffFiltersAllowStudentsPageBySubject() throws InterruptedException {
        filterAllowStudentsPageBySubject();
    }

    @When("Staff searches exams in allow students page")
    public void staffSearchesExamsInAllowStudentsPage() throws InterruptedException {
        searchExamsInAllowStudentsPage();
    }

    @When("Staff clears allow students filters")
    public void staffClearsAllowStudentsFilters() throws InterruptedException {
        clearAllowStudentsFilters();
    }

    @Then("Allow students filters should work successfully")
    public void allowStudentsFiltersShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Allow students filters did not work successfully",
                areAllowStudentsFiltersWorkingSuccessfully()
        );
        System.out.println("Allow students filters worked successfully");
    }

    @When("Staff refreshes allow students page")
    public void staffRefreshesAllowStudentsPage() throws InterruptedException {
        refreshAllowStudentsPage();
    }

    @Then("Allow students refresh should work successfully")
    public void allowStudentsRefreshShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Allow students refresh did not work successfully",
                isAllowStudentsRefreshWorkingSuccessfully()
        );
        System.out.println("Allow students refresh worked successfully");
    }

    @When("Staff clicks first manage students button")
    public void staffClicksFirstManageStudentsButton() throws InterruptedException {
        clickFirstManageStudentsButton();
    }

    @Then("Manage students modal should open successfully")
    public void manageStudentsModalShouldOpenSuccessfully() {
        Assert.assertTrue(
                "Manage students modal did not open successfully",
                isManageStudentsModalOpenedSuccessfully()
        );
        System.out.println("Manage students modal opened successfully");
    }

    @When("Staff closes manage students modal")
    public void staffClosesManageStudentsModal() throws InterruptedException {
        closeManageStudentsModal();
    }

    @Then("Manage students modal should close successfully")
    public void manageStudentsModalShouldCloseSuccessfully() {
        Assert.assertTrue(
                "Manage students modal did not close successfully",
                isManageStudentsModalClosedSuccessfully()
        );
        System.out.println("Manage students modal closed successfully");
    }
}