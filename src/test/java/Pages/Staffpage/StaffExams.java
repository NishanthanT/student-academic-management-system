package Pages.Staffpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

public class StaffExams extends BrowserDriver {

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void scrollIntoView(WebElement element) throws InterruptedException {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({behavior:'instant', block:'center'});",
                element
        );
        Thread.sleep(800);
    }

    public static void clearInput(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static void clickExamsNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("staff-nav-exams"));
        navBtn.click();
        Thread.sleep(2000);

        waitForVisible(By.id("staff-exam-subject-filter"));
    }

    public static void clickDraftExamsTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.xpath("//button[contains(.,'Draft')]"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1200);
    }

    public static void clickPendingExamsTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.xpath("//button[contains(.,'Pending')]"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1200);
    }

    public static void clickChangesExamsTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.xpath("//button[contains(.,'Changes')]"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1200);
    }

    public static void clickApprovedExamsTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.xpath("//button[contains(.,'Approved')]"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1200);
    }

    public static void clickRejectedExamsTab() throws InterruptedException {
        WebElement tab = waitForClickable(By.xpath("//button[contains(.,'Rejected')]"));
        scrollIntoView(tab);
        tab.click();
        Thread.sleep(1200);
    }

    public static boolean areStaffExamTabsWorkingSuccessfully() {
        try {
            return waitForVisible(By.id("staff-exam-subject-filter")).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public static void filterExamsBySubject() throws InterruptedException {
        WebElement subjectSelectElement = waitForVisible(By.id("staff-exam-subject-filter"));
        scrollIntoView(subjectSelectElement);

        Select subjectSelect = new Select(subjectSelectElement);
        List<WebElement> options = subjectSelect.getOptions();

        if (options.size() > 1) {
            subjectSelect.selectByIndex(1);
            Thread.sleep(1500);
        }
    }

    public static void filterExamsByFromDate() throws InterruptedException {
        WebElement fromDateInput = waitForVisible(By.id("staff-exam-from-filter"));
        scrollIntoView(fromDateInput);

        clearInput(fromDateInput);
        fromDateInput.sendKeys(LocalDate.now().toString());
        Thread.sleep(1500);
    }

    public static void filterExamsByToDate() throws InterruptedException {
        WebElement toDateInput = waitForVisible(By.id("staff-exam-to-filter"));
        scrollIntoView(toDateInput);

        clearInput(toDateInput);
        toDateInput.sendKeys(LocalDate.now().plusDays(30).toString());
        Thread.sleep(1500);
    }

    public static void searchExams() throws InterruptedException {
        WebElement searchInput = waitForVisible(By.id("staff-exam-search-input"));
        scrollIntoView(searchInput);

        clearInput(searchInput);
        searchInput.sendKeys("EXAM");
        Thread.sleep(1500);
    }

    public static void clearExamFilters() throws InterruptedException {
        WebElement clearBtn = waitForClickable(By.id("staff-exam-clear-filters-button"));
        scrollIntoView(clearBtn);
        clearBtn.click();
        Thread.sleep(1500);
    }

    public static boolean areStaffExamFiltersWorkingSuccessfully() {
        try {
            WebElement subjectSelectElement = waitForVisible(By.id("staff-exam-subject-filter"));
            Select subjectSelect = new Select(subjectSelectElement);

            WebElement fromDateInput = waitForVisible(By.id("staff-exam-from-filter"));
            WebElement toDateInput = waitForVisible(By.id("staff-exam-to-filter"));
            WebElement searchInput = waitForVisible(By.id("staff-exam-search-input"));

            boolean subjectReset = subjectSelect.getFirstSelectedOption().getAttribute("value").equals("all");
            boolean fromReset = fromDateInput.getAttribute("value").isEmpty();
            boolean toReset = toDateInput.getAttribute("value").isEmpty();
            boolean searchReset = searchInput.getAttribute("value").isEmpty();

            return subjectReset && fromReset && toReset && searchReset;
        } catch (Exception e) {
            return false;
        }
    }

    public static void refreshExamsPage() throws InterruptedException {
        WebElement refreshBtn = waitForClickable(By.xpath("//button[contains(.,'Refresh')]"));
        scrollIntoView(refreshBtn);
        refreshBtn.click();
        Thread.sleep(2000);
    }

    public static boolean isStaffExamsRefreshWorkingSuccessfully() {
        try {
            return waitForVisible(By.id("staff-exam-subject-filter")).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public static void openCreateExamModal() throws InterruptedException {
        WebElement createBtn = waitForClickable(By.xpath("//button[contains(.,'+ Create Exam')]"));
        scrollIntoView(createBtn);
        createBtn.click();
        Thread.sleep(1500);

        waitForVisible(By.id("staff-exam-title-input"));
    }

    public static void closeCreateExamModal() throws InterruptedException {
        WebElement closeBtn = waitForClickable(By.xpath("//button[@aria-label='close']"));
        scrollIntoView(closeBtn);
        closeBtn.click();
        Thread.sleep(1200);
    }

    public static boolean isCreateExamModalWorkingSuccessfully() {
        try {
            return waitForVisible(By.id("staff-exam-subject-filter")).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}