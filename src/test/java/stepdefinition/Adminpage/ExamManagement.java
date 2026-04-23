package stepdefinition.Adminpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Adminpage.ExamManagement.*;

public class ExamManagement {

    @Given("Admin clicks exam management navigation button")
    public void adminClicksExamManagementNavigationButton() throws InterruptedException {
        clickExamManagementNavigationButton();
    }

    @When("Admin clicks pending tab")
    public void adminClicksPendingTab() throws InterruptedException {
        clickPendingTab();
    }

    @When("Admin clicks changes tab")
    public void adminClicksChangesTab() throws InterruptedException {
        clickChangesTab();
    }

    @When("Admin clicks approved tab")
    public void adminClicksApprovedTab() throws InterruptedException {
        clickApprovedTab();
    }

    @When("Admin clicks rejected tab")
    public void adminClicksRejectedTab() throws InterruptedException {
        clickRejectedTab();
    }

    @Then("Exam status tabs should work successfully")
    public void examStatusTabsShouldWorkSuccessfully() {
        Assert.assertTrue("Exam tabs did not work successfully", areExamTabsWorkingSuccessfully());
        System.out.println("Exam tabs worked successfully");
    }

    @When("Admin filters exams by subject")
    public void adminFiltersExamsBySubject() throws InterruptedException {
        filterExamsBySubject();
    }

    @When("Admin filters exams by date")
    public void adminFiltersExamsByDate() throws InterruptedException {
        filterExamsByDate();
    }

    @When("Admin searches exams")
    public void adminSearchesExams() throws InterruptedException {
        searchExams();
    }

    @When("Admin clears exam filters")
    public void adminClearsExamFilters() throws InterruptedException {
        clearExamFilters();
    }

    @Then("Exam filters should work successfully")
    public void examFiltersShouldWorkSuccessfully() {
        Assert.assertTrue("Exam filters did not work successfully", areExamFiltersWorkingSuccessfully());
        System.out.println("Exam filters worked successfully");
    }

    @When("Admin refreshes exam management page")
    public void adminRefreshesExamManagementPage() throws InterruptedException {
        refreshExamManagementPage();
    }

    @Then("Exam management refresh should work successfully")
    public void examManagementRefreshShouldWorkSuccessfully() {
        Assert.assertTrue("Exam management refresh did not work successfully", isExamManagementRefreshWorkingSuccessfully());
        System.out.println("Exam management refresh worked successfully");
    }
}