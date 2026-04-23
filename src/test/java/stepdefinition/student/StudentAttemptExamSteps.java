package stepdefinition.student;

import Pages.student.StudentAttemptExam;
import Utility.BrowserDriver;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;
import org.openqa.selenium.WebDriver;

public class StudentAttemptExamSteps {

    WebDriver driver = BrowserDriver.driver;
    StudentAttemptExam page = new StudentAttemptExam(driver);

    @Given("Student clicks attempt exam navigation")
    public void studentClicksAttemptExamNavigation() {
        page.clickAttemptExamNav();
    }

    @Then("Attempt exam page should be displayed")
    public void attemptExamPageShouldBeDisplayed() {
        Assert.assertTrue("Attempt exam page was not displayed properly", page.isAttemptExamPageDisplayed());
    }

    @When("Student checks available exams section")
    public void studentChecksAvailableExamsSection() {
        // method call not needed here, validation next step la
    }

    @Then("Available exams section should work successfully")
    public void availableExamsSectionShouldWorkSuccessfully() {
        Assert.assertTrue("Available exams section did not work properly", page.isAvailableExamsSectionWorking());
    }

    @When("Student clicks first exam action button if enabled")
    public void studentClicksFirstExamActionButtonIfEnabled() {
        Assert.assertTrue("Could not handle first exam action button", page.clickFirstExamActionButtonIfEnabled());
    }

    @Then("Password modal action should work successfully")
    public void passwordModalActionShouldWorkSuccessfully() {
        Assert.assertTrue("Password modal action did not work properly", page.isPasswordModalActionWorking());
    }
}