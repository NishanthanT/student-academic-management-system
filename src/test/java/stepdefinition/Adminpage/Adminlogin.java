package stepdefinition.Adminpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Adminpage.Adminlogin.*;

public class Adminlogin {

    @Given("Admin navigate to the login page")
    public void adminNavigateToTheLoginPage() throws InterruptedException {
        naviagtetoAdminLoginPageURL();
    }

    @When("Admin enters invalid email and valid password")
    public void adminEntersInvalidEmailAndValidPassword() throws InterruptedException {
        enterInvalidEmailAndValidPassword();
    }

    @When("Admin enters valid email and invalid password")
    public void adminEntersValidEmailAndInvalidPassword() throws InterruptedException {
        enterValidEmailAndInvalidPassword();
    }

    @When("Admin enters valid email and valid password")
    public void adminEntersValidEmailAndValidPassword() throws InterruptedException {
        enterValidEmailAndValidPassword();
    }

    @When("Admin clears the login fields")
    public void adminClearsTheLoginFields() throws InterruptedException {
        clearLoginFields();
    }

    @When("Admin clicks the login button")
    public void adminClicksTheLoginButton() throws InterruptedException {
        clickLoginButton();
    }

    @Then("Invalid credentials message should be displayed")
    public void invalidCredentialsMessageShouldBeDisplayed() {
        Assert.assertTrue("Invalid credentials message was not displayed", isInvalidCredentialsMessageDisplayed());
        System.out.println("Invalid credentials message displayed successfully");
    }

    @Then("Admin should be redirected to the admin dashboard")
    public void adminShouldBeRedirectedToTheAdminDashboard() {
        Assert.assertTrue("Admin dashboard was not loaded", isAdminDashboardLoaded());
        System.out.println("Admin login completed successfully");
    }

    @When("Admin clicks the export pdf button")
    public void adminClicksTheExportPdfButton() throws InterruptedException {
        clickExportPdfButton();
    }

    @Then("Admin pdf should be downloaded successfully")
    public void adminPdfShouldBeDownloadedSuccessfully() {
        Assert.assertTrue("PDF was not downloaded successfully", isPdfDownloadedSuccessfully());
        System.out.println("PDF downloaded successfully");
    }
}