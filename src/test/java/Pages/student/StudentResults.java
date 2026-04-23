package Pages.student;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class StudentResults {

    WebDriver driver;
    WebDriverWait wait;

    public StudentResults(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    // NAV
    By resultsNav = By.id("student-nav-view-results");

    // PAGE
    By pageTitle = By.id("student-results-title");
    By subjectDropdown = By.id("student-results-select-subject");
    By examDropdown = By.id("student-results-select-exam");

    // RESULT AREA
    By resultBox = By.id("student-results-resultbox");
    By statusBadge = By.id("student-results-status-badge");
    By noData = By.id("student-results-nodata");
    By noExam = By.id("student-results-noexam");
    By loading = By.id("student-results-loading");

    public void clickResultsNav() {
        wait.until(ExpectedConditions.elementToBeClickable(resultsNav)).click();
    }

    public boolean isPageDisplayed() {
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(pageTitle)).isDisplayed()
                    && wait.until(ExpectedConditions.visibilityOfElementLocated(subjectDropdown)).isDisplayed()
                    && wait.until(ExpectedConditions.visibilityOfElementLocated(examDropdown)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void changeSubject() {
        WebElement dropdown = wait.until(ExpectedConditions.visibilityOfElementLocated(subjectDropdown));
        Select select = new Select(dropdown);

        if (select.getOptions().size() > 1) {
            select.selectByIndex(0);
            waitForReload();
        }
    }

    public void changeExam() {
        WebElement dropdown = wait.until(ExpectedConditions.visibilityOfElementLocated(examDropdown));
        Select select = new Select(dropdown);

        if (select.getOptions().size() > 0) {
            select.selectByIndex(0);
            waitForReload();
        }
    }

    private void waitForReload() {
        try {
            Thread.sleep(2000);
        } catch (Exception ignored) {
        }
    }

    public boolean isResultDataLoaded() {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(resultBox));

            List<WebElement> loadingEls = driver.findElements(loading);
            if (!loadingEls.isEmpty()) {
                return true;
            }

            List<WebElement> statusEls = driver.findElements(statusBadge);
            List<WebElement> noDataEls = driver.findElements(noData);
            List<WebElement> noExamEls = driver.findElements(noExam);

            return !statusEls.isEmpty() || !noDataEls.isEmpty() || !noExamEls.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}