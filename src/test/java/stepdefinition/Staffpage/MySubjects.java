package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.MySubjects.*;

public class MySubjects {

    @Given("Staff clicks my subjects navigation button")
    public void staffClicksMySubjectsNavigationButton() throws InterruptedException {
        clickMySubjectsNavigationButton();
    }

    @When("Staff filters subjects by year")
    public void staffFiltersSubjectsByYear() throws InterruptedException {
        filterSubjectsByYear();
    }

    @When("Staff filters subjects by semester")
    public void staffFiltersSubjectsBySemester() throws InterruptedException {
        filterSubjectsBySemester();
    }

    @When("Staff searches subjects")
    public void staffSearchesSubjects() throws InterruptedException {
        searchSubjects();
    }

    @When("Staff refreshes my subjects page")
    public void staffRefreshesMySubjectsPage() throws InterruptedException {
        refreshMySubjectsPage();
    }

    @Then("My subjects filters should work successfully")
    public void mySubjectsFiltersShouldWorkSuccessfully() {
        Assert.assertTrue(
                "My subjects filters did not work successfully",
                areMySubjectsFiltersWorkingSuccessfully()
        );
        System.out.println("My subjects page and filters worked successfully");
    }
}