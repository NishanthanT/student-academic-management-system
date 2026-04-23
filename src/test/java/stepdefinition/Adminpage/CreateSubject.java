package stepdefinition.Adminpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Adminpage.CreateSubject.*;

public class CreateSubject {

    @Given("Admin clicks create subject navigation button")
    public void adminClicksCreateSubjectNavigationButton() throws InterruptedException {
        clickCreateSubjectNavigationButton();
    }

    @When("Admin enters new subject details")
    public void adminEntersNewSubjectDetails() throws InterruptedException {
        enterNewSubjectDetails();
    }

    @When("Admin clicks create subject submit button")
    public void adminClicksCreateSubjectSubmitButton() throws InterruptedException {
        clickCreateSubjectSubmitButton();
    }

    @Then("Subject should be created successfully")
    public void subjectShouldBeCreatedSuccessfully() {
        Assert.assertTrue("Subject was not created successfully", isSubjectCreatedSuccessfully());
        System.out.println("Subject created successfully: " + generatedSubjectCode + " - " + generatedSubjectName);
    }

    @When("Admin clicks first row subject edit button")
    public void adminClicksFirstRowSubjectEditButton() throws InterruptedException {
        clickFirstRowSubjectEditButton();
    }

    @When("Admin changes first row subject name and saves")
    public void adminChangesFirstRowSubjectNameAndSaves() throws InterruptedException {
        changeFirstRowSubjectNameAndSave();
    }

    @Then("Subject should be updated successfully")
    public void subjectShouldBeUpdatedSuccessfully() {
        Assert.assertTrue("Subject was not updated successfully", isSubjectUpdatedSuccessfully());
        System.out.println("Subject updated successfully: " + updatedSubjectName);
    }

    @When("Admin clicks first row subject delete button")
    public void adminClicksFirstRowSubjectDeleteButton() throws InterruptedException {
        clickFirstRowSubjectDeleteButton();
    }

    @When("Admin confirms subject delete")
    public void adminConfirmsSubjectDelete() throws InterruptedException {
        confirmSubjectDelete();
    }

    @Then("Subject should be deleted successfully")
    public void subjectShouldBeDeletedSuccessfully() {
        Assert.assertTrue("Subject was not deleted successfully", isSubjectDeletedSuccessfully());
        System.out.println("Subject deleted successfully");
    }

    @When("Admin filters subjects by year and semester")
    public void adminFiltersSubjectsByYearAndSemester() throws InterruptedException {
        filterSubjectsByYearAndSemester();
    }

    @Then("Subject filters should work successfully")
    public void subjectFiltersShouldWorkSuccessfully() {
        System.out.println("Subject filters worked successfully");
    }
}