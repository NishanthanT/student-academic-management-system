package stepdefinition.student;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Studentpage.StudentDashboard.*;

public class StudentDashboard {

    @Given("Student navigates to the dashboard page")
    public void studentNavigatesToTheDashboardPage() throws InterruptedException {
        navigatesToTheDashboardPage();
    }

    @When("Student scrolls down the dashboard page fully")
    public void studentScrollsDownTheDashboardPageFully() throws InterruptedException {
        scrollDownTheDashboardPageFully();
    }

    @When("Student scrolls up the dashboard page fully")
    public void studentScrollsUpTheDashboardPageFully() throws InterruptedException {
        scrollUpTheDashboardPageFully();
    }

    @Then("Student dashboard scrolling should work successfully")
    public void studentDashboardScrollingShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Student dashboard scrolling did not work successfully",
                isStudentDashboardScrollingWorkingSuccessfully()
        );
        System.out.println("Student dashboard scrolling worked successfully");
    }
}