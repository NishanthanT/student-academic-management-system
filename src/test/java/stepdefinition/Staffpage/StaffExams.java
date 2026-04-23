package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.StaffExams.*;

public class StaffExams {

    @Given("Staff clicks exams navigation button")
    public void staffClicksExamsNavigationButton() throws InterruptedException {
        clickExamsNavigationButton();
    }

    @When("Staff clicks draft exams tab")
    public void staffClicksDraftExamsTab() throws InterruptedException {
        clickDraftExamsTab();
    }

    @When("Staff clicks pending exams tab")
    public void staffClicksPendingExamsTab() throws InterruptedException {
        clickPendingExamsTab();
    }

    @When("Staff clicks changes exams tab")
    public void staffClicksChangesExamsTab() throws InterruptedException {
        clickChangesExamsTab();
    }

    @When("Staff clicks approved exams tab")
    public void staffClicksApprovedExamsTab() throws InterruptedException {
        clickApprovedExamsTab();
    }

    @When("Staff clicks rejected exams tab")
    public void staffClicksRejectedExamsTab() throws InterruptedException {
        clickRejectedExamsTab();
    }

    @Then("Staff exam tabs should work successfully")
    public void staffExamTabsShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Staff exam tabs did not work successfully",
                areStaffExamTabsWorkingSuccessfully()
        );
        System.out.println("Staff exam tabs worked successfully");
    }

    @When("Staff filters exams by subject")
    public void staffFiltersExamsBySubject() throws InterruptedException {
        filterExamsBySubject();
    }

    @When("Staff filters exams by from date")
    public void staffFiltersExamsByFromDate() throws InterruptedException {
        filterExamsByFromDate();
    }

    @When("Staff filters exams by to date")
    public void staffFiltersExamsByToDate() throws InterruptedException {
        filterExamsByToDate();
    }

    @When("Staff searches exams")
    public void staffSearchesExams() throws InterruptedException {
        searchExams();
    }

    @When("Staff clears exam filters")
    public void staffClearsExamFilters() throws InterruptedException {
        clearExamFilters();
    }

    @Then("Staff exam filters should work successfully")
    public void staffExamFiltersShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Staff exam filters did not work successfully",
                areStaffExamFiltersWorkingSuccessfully()
        );
        System.out.println("Staff exam filters worked successfully");
    }

    @When("Staff refreshes exams page")
    public void staffRefreshesExamsPage() throws InterruptedException {
        refreshExamsPage();
    }

    @Then("Staff exams refresh should work successfully")
    public void staffExamsRefreshShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Staff exams refresh did not work successfully",
                isStaffExamsRefreshWorkingSuccessfully()
        );
        System.out.println("Staff exams refresh worked successfully");
    }

    @When("Staff opens create exam modal")
    public void staffOpensCreateExamModal() throws InterruptedException {
        openCreateExamModal();
    }

    @When("Staff closes create exam modal")
    public void staffClosesCreateExamModal() throws InterruptedException {
        closeCreateExamModal();
    }

    @Then("Staff create exam modal should work successfully")
    public void staffCreateExamModalShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Staff create exam modal did not work successfully",
                isCreateExamModalWorkingSuccessfully()
        );
        System.out.println("Staff create exam modal worked successfully");
    }
}