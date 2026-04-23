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

public class MySubjects extends BrowserDriver {

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

    public static void clickMySubjectsNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("staff-nav-subjects"));
        navBtn.click();
        Thread.sleep(2000);

        waitForVisible(By.id("mysubjects-button-1"));
    }

    public static void filterSubjectsByYear() throws InterruptedException {
        WebElement yearSelectElement = waitForVisible(By.id("mysubjects-select-1"));
        scrollIntoView(yearSelectElement);

        Select yearSelect = new Select(yearSelectElement);
        yearSelect.selectByValue("1");
        Thread.sleep(1500);

        yearSelect.selectByValue("all");
        Thread.sleep(1000);
    }

    public static void filterSubjectsBySemester() throws InterruptedException {
        WebElement semSelectElement = waitForVisible(By.id("mysubjects-select-2"));
        scrollIntoView(semSelectElement);

        Select semSelect = new Select(semSelectElement);
        semSelect.selectByValue("1");
        Thread.sleep(1500);

        semSelect.selectByValue("all");
        Thread.sleep(1000);
    }

    public static void searchSubjects() throws InterruptedException {
        WebElement searchInput = waitForVisible(By.id("mysubjects-input-1"));
        scrollIntoView(searchInput);

        clearInput(searchInput);
        searchInput.sendKeys("IT");
        Thread.sleep(1500);

        clearInput(searchInput);
        Thread.sleep(1000);
    }

    public static void refreshMySubjectsPage() throws InterruptedException {
        WebElement refreshBtn = waitForClickable(By.id("mysubjects-button-1"));
        scrollIntoView(refreshBtn);
        refreshBtn.click();
        Thread.sleep(2000);
    }

    public static boolean areMySubjectsFiltersWorkingSuccessfully() {
        try {
            WebElement yearSelectElement = waitForVisible(By.id("mysubjects-select-1"));
            WebElement semSelectElement = waitForVisible(By.id("mysubjects-select-2"));
            WebElement searchInput = waitForVisible(By.id("mysubjects-input-1"));
            WebElement refreshBtn = waitForVisible(By.id("mysubjects-button-1"));

            return yearSelectElement.isDisplayed()
                    && semSelectElement.isDisplayed()
                    && searchInput.isDisplayed()
                    && refreshBtn.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}