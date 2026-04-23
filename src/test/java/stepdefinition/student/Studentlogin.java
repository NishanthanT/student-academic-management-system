package stepdefinition.Studentpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Studentpage.Studentlogin.*;

public class Studentlogin {

    @Given("Student navigate to the login page")
    public void studentNavigateToTheLoginPage() throws InterruptedException {
        navigateToStudentLoginPageURL();
    }

    @When("Student enters email and password")
    public void studentEntersEmailAndPassword() throws InterruptedException {
        enterStudentEmailAndPassword();
    }

    @When("Student clicks the sign in button")
    public void studentClicksTheSignInButton() throws InterruptedException {
        clickStudentSignInButton();
    }

    @Then("Student should be redirected to the student dashboard")
    public void studentShouldBeRedirectedToTheStudentDashboard() {
        Assert.assertTrue("Student dashboard was not loaded", isStudentDashboardLoaded());
        System.out.println("Student login successful");
    }
}