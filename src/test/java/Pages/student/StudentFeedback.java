package Pages.student;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class StudentFeedback {

    WebDriver driver;
    WebDriverWait wait;

    public StudentFeedback(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    // NAV
    By feedbackNav = By.id("student-nav-feedback");

    // PAGE
    By pageTitle = By.id("student-concern-title");
    By subjectDropdown = By.id("student-concern-subject-select");
    By staffDropdown = By.id("student-concern-staff-select");
    By messageTextarea = By.id("student-concern-message-textarea");
    By submitButton = By.id("student-concern-submit-btn");

    // TOAST
    By toast = By.id("student-results-toast"); // not used
    By successText = By.xpath("//*[contains(text(),'Feedback sent to staff successfully')]");

    public void clickFeedbackNav() {
        wait.until(ExpectedConditions.elementToBeClickable(feedbackNav)).click();
    }

    public boolean isPageDisplayed() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(pageTitle)).isDisplayed()
                    && wait.until(ExpectedConditions.visibilityOfElementLocated(subjectDropdown)).isDisplayed()
                    && wait.until(ExpectedConditions.visibilityOfElementLocated(staffDropdown)).isDisplayed()
                    && wait.until(ExpectedConditions.visibilityOfElementLocated(messageTextarea)).isDisplayed()
                    && wait.until(ExpectedConditions.visibilityOfElementLocated(submitButton)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void selectSubject() {
        WebElement dropdown = wait.until(ExpectedConditions.visibilityOfElementLocated(subjectDropdown));
        Select select = new Select(dropdown);

        if (select.getOptions().size() > 1) {
            select.selectByIndex(1);
            waitForStaffLoad();
        }
    }

    public void selectStaff() {
        WebElement dropdown = wait.until(ExpectedConditions.visibilityOfElementLocated(staffDropdown));
        Select select = new Select(dropdown);

        if (select.getOptions().size() > 0) {
            select.selectByIndex(0);
        }
    }

    public void enterMessage() {
        WebElement textarea = wait.until(ExpectedConditions.visibilityOfElementLocated(messageTextarea));
        textarea.clear();
        textarea.sendKeys("Automation feedback test message");
    }

    public void clickSubmit() {
        wait.until(ExpectedConditions.elementToBeClickable(submitButton)).click();
    }

    public boolean isFeedbackActionWorking() {
        try {
            Thread.sleep(2000);

            List<WebElement> successEls = driver.findElements(successText);
            if (!successEls.isEmpty()) {
                return true;
            }

            WebElement textarea = wait.until(ExpectedConditions.visibilityOfElementLocated(messageTextarea));
            return textarea.getAttribute("value").isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    private void waitForStaffLoad() {
        try {
            Thread.sleep(2000);
        } catch (Exception ignored) {
        }
    }
}