package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.ApprovedExamNotice.*;

public class ApprovedExamNotice {

    @Given("Staff clicks approved exam notice navigation button")
    public void staffClicksApprovedExamNoticeNavigationButton() throws InterruptedException {
        clickApprovedExamNoticeNavigationButton();
    }

    @When("Staff filters approved exams by subject")
    public void staffFiltersApprovedExamsBySubject() throws InterruptedException {
        filterApprovedExamsBySubject();
    }

    @When("Staff searches approved exams")
    public void staffSearchesApprovedExams() throws InterruptedException {
        searchApprovedExams();
    }

    @When("Staff clears approved exam filters")
    public void staffClearsApprovedExamFilters() throws InterruptedException {
        clearApprovedExamFilters();
    }

    @Then("Approved exam filters should work successfully")
    public void approvedExamFiltersShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Approved exam filters did not work successfully",
                areApprovedExamFiltersWorkingSuccessfully()
        );
        System.out.println("Approved exam filters worked successfully");
    }

    @When("Staff refreshes approved exam notice page")
    public void staffRefreshesApprovedExamNoticePage() throws InterruptedException {
        refreshApprovedExamNoticePage();
    }

    @Then("Approved exam notice refresh should work successfully")
    public void approvedExamNoticeRefreshShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Approved exam notice refresh did not work successfully",
                isApprovedExamNoticeRefreshWorkingSuccessfully()
        );
        System.out.println("Approved exam notice refresh worked successfully");
    }

    @When("Staff clicks first approved exam action button")
    public void staffClicksFirstApprovedExamActionButton() throws InterruptedException {
        clickFirstApprovedExamActionButton();
    }

    @Then("Questions page should open successfully")
    public void questionsPageShouldOpenSuccessfully() {
        Assert.assertTrue(
                "Questions page did not open successfully",
                isQuestionsPageOpenedSuccessfully()
        );
        System.out.println("Questions page opened successfully");
    }

    @When("Staff clicks back to approved notice button")
    public void staffClicksBackToApprovedNoticeButton() throws InterruptedException {
        clickBackToApprovedNoticeButton();
    }

    @Then("Approved exam notice page should open successfully again")
    public void approvedExamNoticePageShouldOpenSuccessfullyAgain() {
        Assert.assertTrue(
                "Approved exam notice page did not open successfully again",
                isApprovedExamNoticeOpenedSuccessfullyAgain()
        );
        System.out.println("Approved exam notice page opened successfully again");
    }
}