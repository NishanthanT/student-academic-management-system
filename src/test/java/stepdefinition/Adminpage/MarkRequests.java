package stepdefinition.Adminpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Adminpage.MarkRequests.*;

public class MarkRequests {

    @Given("Admin clicks mark requests navigation button")
    public void adminClicksMarkRequestsNavigationButton() throws InterruptedException {
        clickMarkRequestsNavigationButton();
    }

    @When("Admin selects all requests filter")
    public void adminSelectsAllRequestsFilter() throws InterruptedException {
        selectAllRequestsFilter();
    }

    @When("Admin selects pending requests filter")
    public void adminSelectsPendingRequestsFilter() throws InterruptedException {
        selectPendingRequestsFilter();
    }

    @When("Admin selects approved requests filter")
    public void adminSelectsApprovedRequestsFilter() throws InterruptedException {
        selectApprovedRequestsFilter();
    }

    @When("Admin selects rejected requests filter")
    public void adminSelectsRejectedRequestsFilter() throws InterruptedException {
        selectRejectedRequestsFilter();
    }

    @Then("Mark request filters should work successfully")
    public void markRequestFiltersShouldWorkSuccessfully() {
        Assert.assertTrue("Mark request filters did not work successfully",
                areMarkRequestFiltersWorkingSuccessfully());
        System.out.println("Mark request filters worked successfully");
    }
}