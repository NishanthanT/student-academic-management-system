package Pages.student;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class StudentExamNotice {

    WebDriver driver;
    WebDriverWait wait;

    public StudentExamNotice(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    // NAV
    By examNoticeNav = By.id("student-nav-exam-notice");

    // PAGE
    By pageTitle = By.id("student-examnotice-title");

    // FILTERS
    By subjectDropdown = By.id("student-examnotice-subject-select");
    By examDropdown = By.id("student-examnotice-exam-select");

    // BUTTONS
    By refreshBtn = By.id("student-examnotice-refresh-btn");

    // TABLE
    By viewButtons = By.xpath("//button[contains(@id,'student-examnotice-view-')]");

    // MODAL
    By modal = By.id("student-examnotice-modal-card");
    By modalClose = By.id("student-examnotice-modal-close");

    public void clickExamNoticeNav() {
        wait.until(ExpectedConditions.elementToBeClickable(examNoticeNav)).click();
    }

    public boolean isPageLoaded() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(pageTitle)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void selectSubject() {
        WebElement dropdown = wait.until(ExpectedConditions.visibilityOfElementLocated(subjectDropdown));
        Select select = new Select(dropdown);

        if (select.getOptions().size() > 1) {
            select.selectByIndex(1);
        }
    }

    public void selectExam() {
        WebElement dropdown = wait.until(ExpectedConditions.visibilityOfElementLocated(examDropdown));
        Select select = new Select(dropdown);

        if (select.getOptions().size() > 1) {
            select.selectByIndex(1);
        }
    }

    public void clickViewButtonIfExists() {
        List<WebElement> buttons = driver.findElements(viewButtons);

        if (!buttons.isEmpty()) {
            buttons.get(0).click();
        }
    }

    public boolean isModalDisplayed() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(modal)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void closeModal() {
        List<WebElement> closeButtons = driver.findElements(modalClose);
        if (!closeButtons.isEmpty()) {
            wait.until(ExpectedConditions.elementToBeClickable(modalClose)).click();
        }
    }

    public void clickRefresh() {
        wait.until(ExpectedConditions.elementToBeClickable(refreshBtn)).click();
    }
}