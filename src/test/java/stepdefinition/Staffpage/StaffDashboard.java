package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.StaffDashboard.*;

public class StaffDashboard {

    @Given("Staff clicks dashboard navigation button")
    public void staffClicksDashboardNavigationButton() throws InterruptedException {
        clickDashboardNavigationButton();
    }

    @When("Staff scrolls down the dashboard page")
    public void staffScrollsDownTheDashboardPage() throws InterruptedException {
        scrollDownDashboardPage();
    }

    @When("Staff scrolls up the dashboard page")
    public void staffScrollsUpTheDashboardPage() throws InterruptedException {
        scrollUpDashboardPage();
    }

    @Then("Staff dashboard scrolling should work successfully")
    public void staffDashboardScrollingShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Staff dashboard scrolling did not work successfully",
                isStaffDashboardScrollingWorkingSuccessfully()
        );
        System.out.println("Staff dashboard scrolling worked successfully");
    }
}