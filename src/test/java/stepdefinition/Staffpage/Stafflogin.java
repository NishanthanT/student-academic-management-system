package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.Stafflogin.*;

public class Stafflogin {

    @Given("Staff navigate to the login page")
    public void staffNavigateToTheLoginPage() throws InterruptedException {
        navigateToStaffLoginPageURL();
    }

    @When("Staff enters email and password")
    public void staffEntersEmailAndPassword() throws InterruptedException {
        enterStaffEmailAndPassword();
    }

    @When("Staff clicks the sign in button")
    public void staffClicksTheSignInButton() throws InterruptedException {
        clickStaffSignInButton();
    }

    @Then("Staff should be redirected to the staff dashboard")
    public void staffShouldBeRedirectedToTheStaffDashboard() {
        Assert.assertTrue("Staff dashboard was not loaded", isStaffDashboardLoaded());
        System.out.println("Staff login completed successfully");
    }
}