package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.Results.*;

public class Results {

    @Given("Staff clicks results navigation button")
    public void staffClicksResultsNavigationButton() throws InterruptedException {
        clickResultsNavigationButton();
    }

    @When("Staff changes subject in results page")
    public void staffChangesSubjectInResultsPage() throws InterruptedException {
        changeSubjectInResultsPage();
    }

    @When("Staff changes exam in results page")
    public void staffChangesExamInResultsPage() throws InterruptedException {
        changeExamInResultsPage();
    }

    @When("Staff enters student email in results page")
    public void staffEntersStudentEmailInResultsPage() throws InterruptedException {
        enterStudentEmailInResultsPage();
    }

    @When("Staff clicks apply button in results page")
    public void staffClicksApplyButtonInResultsPage() throws InterruptedException {
        clickApplyButtonInResultsPage();
    }

    @When("Staff clicks clear button in results page")
    public void staffClicksClearButtonInResultsPage() throws InterruptedException {
        clickClearButtonInResultsPage();
    }

    @Then("Results filters should work successfully")
    public void resultsFiltersShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Results filters did not work successfully",
                areResultsFiltersWorkingSuccessfully()
        );
        System.out.println("Results filters worked successfully");
    }

    @When("Staff opens view modal in results page")
    public void staffOpensViewModalInResultsPage() throws InterruptedException {
        openViewModalInResultsPage();
    }

    @When("Staff closes view modal in results page")
    public void staffClosesViewModalInResultsPage() throws InterruptedException {
        closeViewModalInResultsPage();
    }

    @Then("Results view modal should work successfully")
    public void resultsViewModalShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Results view modal did not work successfully",
                isResultsViewModalWorkingSuccessfully()
        );
        System.out.println("Results view modal worked successfully");
    }

    @When("Staff opens edit modal in results page")
    public void staffOpensEditModalInResultsPage() throws InterruptedException {
        openEditModalInResultsPage();
    }

    @When("Staff closes edit modal in results page")
    public void staffClosesEditModalInResultsPage() throws InterruptedException {
        closeEditModalInResultsPage();
    }

    @Then("Results edit modal should work successfully")
    public void resultsEditModalShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Results edit modal did not work successfully",
                isResultsEditModalWorkingSuccessfully()
        );
        System.out.println("Results edit modal worked successfully");
    }

    @When("Staff clicks download results pdf button if visible")
    public void staffClicksDownloadResultsPdfButtonIfVisible() throws InterruptedException {
        clickDownloadResultsPdfButtonIfVisible();
    }

    @Then("Results page actions should work successfully")
    public void resultsPageActionsShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Results page actions did not work successfully",
                areResultsPageActionsWorkingSuccessfully()
        );
        System.out.println("Results page actions worked successfully");
    }
}