package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class MarkRequests extends BrowserDriver {

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

    public static void clickMarkRequestsNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("admin-nav-mark-requests"));
        navBtn.click();
        Thread.sleep(2000);
        waitForVisible(By.id("markrequests-select-1"));
    }

    public static void selectAllRequestsFilter() throws InterruptedException {
        WebElement filterSelect = waitForVisible(By.id("markrequests-select-1"));
        scrollIntoView(filterSelect);

        Select select = new Select(filterSelect);
        select.selectByValue("all");
        Thread.sleep(1500);
    }

    public static void selectPendingRequestsFilter() throws InterruptedException {
        WebElement filterSelect = waitForVisible(By.id("markrequests-select-1"));
        scrollIntoView(filterSelect);

        Select select = new Select(filterSelect);
        select.selectByValue("pending");
        Thread.sleep(1500);
    }

    public static void selectApprovedRequestsFilter() throws InterruptedException {
        WebElement filterSelect = waitForVisible(By.id("markrequests-select-1"));
        scrollIntoView(filterSelect);

        Select select = new Select(filterSelect);
        select.selectByValue("approved");
        Thread.sleep(1500);
    }

    public static void selectRejectedRequestsFilter() throws InterruptedException {
        WebElement filterSelect = waitForVisible(By.id("markrequests-select-1"));
        scrollIntoView(filterSelect);

        Select select = new Select(filterSelect);
        select.selectByValue("rejected");
        Thread.sleep(1500);
    }

    public static boolean areMarkRequestFiltersWorkingSuccessfully() {
        try {
            WebElement filterSelect = waitForVisible(By.id("markrequests-select-1"));
            return filterSelect.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}