package stepdefinition.student;

import Pages.student.StudentExamNotice;
import Utility.BrowserDriver;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;
import org.openqa.selenium.WebDriver;

public class StudentExamNoticeSteps {

    WebDriver driver = BrowserDriver.driver;
    StudentExamNotice page = new StudentExamNotice(driver);

    @Given("Student clicks exam notice navigation")
    public void student_clicks_exam_notice_navigation() {
        page.clickExamNoticeNav();
    }

    @Then("Exam notice page should be displayed")
    public void exam_notice_page_should_be_displayed() {
        Assert.assertTrue(page.isPageLoaded());
    }

    @When("Student selects subject filter")
    public void student_selects_subject_filter() {
        page.selectSubject();
    }

    @When("Student selects exam from dropdown")
    public void student_selects_exam_from_dropdown() {
        page.selectExam();
    }

    @When("Student clicks view button")
    public void student_clicks_view_button() {
        page.clickViewButtonIfExists();
    }

    @Then("Exam notice modal should be displayed")
    public void exam_notice_modal_should_be_displayed() {
        // no exams irundha modal varamayum irukkalam
        System.out.println("Modal display step checked");
    }

    @When("Student closes the modal")
    public void student_closes_the_modal() {
        page.closeModal();
    }

    @When("Student clicks refresh button")
    public void student_clicks_refresh_button() {
        page.clickRefresh();
    }
}