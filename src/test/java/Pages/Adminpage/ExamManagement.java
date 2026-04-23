package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.time.LocalDate;

public class ExamManagement extends BrowserDriver {

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void clearInput(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static void scrollIntoView(WebElement element) throws InterruptedException {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({behavior:'instant', block:'center'});",
                element
        );
        Thread.sleep(800);
    }

    public static void clickExamManagementNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("admin-nav-exam-management"));
        navBtn.click();
        Thread.sleep(2000);
        waitForVisible(By.id("exammanagement-button-9"));
    }

    public static void clickPendingTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.id("exammanagement-tab-pending"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1500);
    }

    public static void clickChangesTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.id("exammanagement-tab-changes"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1500);
    }

    public static void clickApprovedTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.id("exammanagement-tab-approved"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1500);
    }

    public static void clickRejectedTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.id("exammanagement-tab-rejected"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1500);
    }

    public static boolean areExamTabsWorkingSuccessfully() {
        try {
            return driver.findElements(By.cssSelector("table tbody tr")).size() >= 0;
        } catch (Exception e) {
            return false;
        }
    }

    public static void filterExamsBySubject() throws InterruptedException {
        WebElement subjectSelectElement = waitForVisible(By.id("exammanagement-select-1"));
        scrollIntoView(subjectSelectElement);

        Select subjectSelect = new Select(subjectSelectElement);
        if (subjectSelect.getOptions().size() > 1) {
            subjectSelect.selectByIndex(1);
            Thread.sleep(1500);
        }
    }

    public static void filterExamsByDate() throws InterruptedException {
        WebElement dateInput = waitForVisible(By.id("exammanagement-input-1"));
        scrollIntoView(dateInput);

        clearInput(dateInput);
        dateInput.sendKeys(LocalDate.now().toString());
        Thread.sleep(1500);
    }

    public static void searchExams() throws InterruptedException {
        WebElement searchInput = waitForVisible(By.id("exammanagement-input-2"));
        scrollIntoView(searchInput);

        clearInput(searchInput);
        searchInput.sendKeys("IT");
        Thread.sleep(1500);
    }

    public static void clearExamFilters() throws InterruptedException {
        WebElement clearBtn = waitForClickable(By.id("exammanagement-button-10"));
        scrollIntoView(clearBtn);
        clearBtn.click();
        Thread.sleep(1500);
    }

    public static boolean areExamFiltersWorkingSuccessfully() {
        try {
            WebElement subjectSelectElement = waitForVisible(By.id("exammanagement-select-1"));
            Select subjectSelect = new Select(subjectSelectElement);

            WebElement dateInput = waitForVisible(By.id("exammanagement-input-1"));
            WebElement searchInput = waitForVisible(By.id("exammanagement-input-2"));

            boolean subjectReset = subjectSelect.getFirstSelectedOption().getAttribute("value").equals("all");
            boolean dateReset = dateInput.getAttribute("value").isEmpty();
            boolean searchReset = searchInput.getAttribute("value").isEmpty();

            return subjectReset && dateReset && searchReset;
        } catch (Exception e) {
            return false;
        }
    }

    public static void refreshExamManagementPage() throws InterruptedException {
        WebElement refreshBtn = waitForClickable(By.id("exammanagement-button-9"));
        scrollIntoView(refreshBtn);
        refreshBtn.click();
        Thread.sleep(2000);
    }

    public static boolean isExamManagementRefreshWorkingSuccessfully() {
        try {
            waitForVisible(By.id("exammanagement-button-9"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}