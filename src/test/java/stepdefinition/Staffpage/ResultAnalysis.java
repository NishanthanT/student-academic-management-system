package stepdefinition.Staffpage;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import static Pages.Staffpage.ResultAnalysis.*;

public class ResultAnalysis {

    @Given("Staff clicks result analysis navigation button")
    public void staffClicksResultAnalysisNavigationButton() throws InterruptedException {
        clickResultAnalysisNavigationButton();
    }

    @When("Staff selects subject in result analysis page")
    public void staffSelectsSubjectInResultAnalysisPage() throws InterruptedException {
        selectSubjectInResultAnalysisPage();
    }

    @When("Staff selects exam in result analysis page")
    public void staffSelectsExamInResultAnalysisPage() throws InterruptedException {
        selectExamInResultAnalysisPage();
    }

    @Then("Result analysis data should load successfully")
    public void resultAnalysisDataShouldLoadSuccessfully() {
        Assert.assertTrue(
                "Result analysis data did not load successfully",
                isResultAnalysisDataLoadedSuccessfully()
        );
        System.out.println("Result analysis data loaded successfully");
    }

    @When("Staff clicks download analysis report button if visible")
    public void staffClicksDownloadAnalysisReportButtonIfVisible() throws InterruptedException {
        clickDownloadAnalysisReportButtonIfVisible();
    }

    @Then("Result analysis actions should work successfully")
    public void resultAnalysisActionsShouldWorkSuccessfully() {
        Assert.assertTrue(
                "Result analysis actions did not work successfully",
                areResultAnalysisActionsWorkingSuccessfully()
        );
        System.out.println("Result analysis actions worked successfully");
    }
}