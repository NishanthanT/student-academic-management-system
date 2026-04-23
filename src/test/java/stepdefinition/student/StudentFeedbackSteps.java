package stepdefinition.student;

import Pages.student.StudentFeedback;
import Utility.BrowserDriver;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;
import org.openqa.selenium.WebDriver;

public class StudentFeedbackSteps {

    WebDriver driver = BrowserDriver.driver;
    StudentFeedback page = new StudentFeedback(driver);

    @Given("Student clicks feedback navigation")
    public void studentClicksFeedbackNavigation() {
        page.clickFeedbackNav();
    }

    @Then("Student feedback page should be displayed")
    public void studentFeedbackPageShouldBeDisplayed() {
        Assert.assertTrue("Student feedback page was not displayed", page.isPageDisplayed());
    }

    @When("Student selects subject in feedback page")
    public void studentSelectsSubjectInFeedbackPage() {
        page.selectSubject();
    }

    @When("Student selects staff in feedback page")
    public void studentSelectsStaffInFeedbackPage() {
        page.selectStaff();
    }

    @When("Student enters message in feedback page")
    public void studentEntersMessageInFeedbackPage() {
        page.enterMessage();
    }

    @When("Student clicks submit feedback button")
    public void studentClicksSubmitFeedbackButton() {
        page.clickSubmit();
    }

    @Then("Student feedback action should work successfully")
    public void studentFeedbackActionShouldWorkSuccessfully() {
        Assert.assertTrue("Student feedback action did not work successfully", page.isFeedbackActionWorking());
    }
}