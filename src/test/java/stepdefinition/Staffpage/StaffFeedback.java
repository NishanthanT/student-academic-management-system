package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.StaffFeedback.*;

public class StaffFeedback {

    @Given("Staff clicks feedback navigation button")
    public void staffClicksFeedbackNavigationButton() throws InterruptedException {
        clickFeedbackNavigationButton();
    }

    @When("Staff clicks first feedback action button")
    public void staffClicksFirstFeedbackActionButton() throws InterruptedException {
        clickFirstFeedbackActionButton();
    }

    @Then("Staff feedback action should work successfully")
    public void staffFeedbackActionShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Staff feedback action did not work successfully",
                isStaffFeedbackActionWorkingSuccessfully()
        );
        System.out.println("Staff feedback action worked successfully");
    }
}