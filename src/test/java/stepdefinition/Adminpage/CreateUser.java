package stepdefinition.Adminpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Adminpage.CreateUser.*;

public class CreateUser {

    @Given("Admin clicks create user navigation button")
    public void adminClicksCreateUserNavigationButton() throws InterruptedException {
        clickCreateUserNavigationButton();
    }

    @When("Admin enters new staff user details")
    public void adminEntersNewStaffUserDetails() throws InterruptedException {
        enterNewStaffUserDetails();
    }

    @When("Admin enters new student user details")
    public void adminEntersNewStudentUserDetails() throws InterruptedException {
        enterNewStudentUserDetails();
    }

    @When("Admin clicks create user submit button")
    public void adminClicksCreateUserSubmitButton() throws InterruptedException {
        clickCreateUserSubmitButton();
    }

    @Then("Staff user should be created successfully")
    public void staffUserShouldBeCreatedSuccessfully() {
        String toastMessage = getToastMessage();
        Assert.assertTrue("Staff user success toast not shown",
                toastMessage.toLowerCase().contains("created successfully"));
        System.out.println("Staff user created successfully: " + generatedStaffEmail);
    }

    @Then("Student user should be created successfully")
    public void studentUserShouldBeCreatedSuccessfully() {
        String toastMessage = getToastMessage();
        Assert.assertTrue("Student user success toast not shown",
                toastMessage.toLowerCase().contains("created successfully"));
        System.out.println("Student user created successfully: " + generatedStudentEmail);
    }
}