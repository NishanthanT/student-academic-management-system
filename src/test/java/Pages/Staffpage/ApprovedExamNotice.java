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
import java.util.List;

public class ApprovedExamNotice extends BrowserDriver {

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

    public static void clickApprovedExamNoticeNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("staff-nav-questions"));
        navBtn.click();
        Thread.sleep(2000);

        // Subject dropdown + search இருக்குற page load check
        waitForVisible(By.xpath("//select"));
        waitForVisible(By.xpath("//input[contains(@placeholder,'Search by exam title')]"));
    }

    public static void filterApprovedExamsBySubject() throws InterruptedException {
        WebElement subjectSelectElement = waitForVisible(By.xpath("//select"));
        scrollIntoView(subjectSelectElement);

        Select subjectSelect = new Select(subjectSelectElement);
        List<WebElement> options = subjectSelect.getOptions();

        if (options.size() > 1) {
            subjectSelect.selectByIndex(1);
            Thread.sleep(1500);
        }
    }

    public static void searchApprovedExams() throws InterruptedException {
        WebElement searchInput = waitForVisible(
                By.xpath("//input[contains(@placeholder,'Search by exam title') or contains(@placeholder,'Search')]")
        );
        scrollIntoView(searchInput);

        clearInput(searchInput);
        searchInput.sendKeys("IT");
        Thread.sleep(1500);
    }

    public static void clearApprovedExamFilters() throws InterruptedException {
        WebElement clearBtn = waitForClickable(By.xpath("//button[contains(.,'Clear')]"));
        scrollIntoView(clearBtn);
        clearBtn.click();
        Thread.sleep(1500);
    }

    public static boolean areApprovedExamFiltersWorkingSuccessfully() {
        try {
            WebElement subjectSelectElement = waitForVisible(By.xpath("//select"));
            Select subjectSelect = new Select(subjectSelectElement);

            WebElement searchInput = waitForVisible(
                    By.xpath("//input[contains(@placeholder,'Search by exam title') or contains(@placeholder,'Search')]")
            );

            boolean subjectReset = subjectSelect.getFirstSelectedOption().getAttribute("value").equals("all");
            boolean searchReset = searchInput.getAttribute("value").isEmpty();

            return subjectReset && searchReset;
        } catch (Exception e) {
            return false;
        }
    }

    public static void refreshApprovedExamNoticePage() throws InterruptedException {
        WebElement refreshBtn = waitForClickable(By.xpath("//button[contains(.,'Refresh')]"));
        scrollIntoView(refreshBtn);
        refreshBtn.click();
        Thread.sleep(2000);
    }

    public static boolean isApprovedExamNoticeRefreshWorkingSuccessfully() {
        try {
            return waitForVisible(By.xpath("//button[contains(.,'Refresh')]")).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public static void clickFirstApprovedExamActionButton() throws InterruptedException {
        List<WebElement> actionButtons = driver.findElements(
                By.xpath("//button[contains(.,'Create Questions') or contains(.,'View Questions')]")
        );

        if (actionButtons.isEmpty()) {
            throw new RuntimeException("No approved exam action button found");
        }

        WebElement firstActionBtn = actionButtons.get(0);
        scrollIntoView(firstActionBtn);
        firstActionBtn.click();
        Thread.sleep(2000);
    }

    public static boolean isQuestionsPageOpenedSuccessfully() {
        try {
            boolean titleVisible = driver.findElements(By.id("page_title_questions")).size() > 0;
            boolean backButtonVisible = driver.findElements(By.id("btn_back_to_approved_notice")).size() > 0;
            return titleVisible && backButtonVisible;
        } catch (Exception e) {
            return false;
        }
    }

    public static void clickBackToApprovedNoticeButton() throws InterruptedException {
        WebElement backBtn = waitForClickable(By.id("btn_back_to_approved_notice"));
        scrollIntoView(backBtn);
        backBtn.click();
        Thread.sleep(2000);
    }

    public static boolean isApprovedExamNoticeOpenedSuccessfullyAgain() {
        try {
            boolean refreshVisible = driver.findElements(By.xpath("//button[contains(.,'Refresh')]")).size() > 0;
            boolean clearVisible = driver.findElements(By.xpath("//button[contains(.,'Clear')]")).size() > 0;
            return refreshVisible && clearVisible;
        } catch (Exception e) {
            return false;
        }
    }
}