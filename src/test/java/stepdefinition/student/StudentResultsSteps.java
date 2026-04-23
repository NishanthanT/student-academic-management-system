package stepdefinition.student;

import Pages.student.StudentResults;
import Utility.BrowserDriver;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;
import org.openqa.selenium.WebDriver;

public class StudentResultsSteps {

    WebDriver driver = BrowserDriver.driver;
    StudentResults page = new StudentResults(driver);

    @Given("Student clicks view results navigation")
    public void studentClicksViewResultsNavigation() {
        page.clickResultsNav();
    }

    @Then("Student results page should be displayed")
    public void studentResultsPageShouldBeDisplayed() {
        Assert.assertTrue("Student results page was not displayed", page.isPageDisplayed());
    }

    @When("Student changes subject in results page")
    public void studentChangesSubjectInResultsPage() {
        page.changeSubject();
    }

    @When("Student changes exam in results page")
    public void studentChangesExamInResultsPage() {
        page.changeExam();
    }

    @Then("Student results data should load successfully")
    public void studentResultsDataShouldLoadSuccessfully() {
        Assert.assertTrue("Student results data did not load successfully", page.isResultDataLoaded());
    }
}