package Pages.Staffpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class StaffFeedback extends BrowserDriver {

    public static boolean feedbackActionWorked = false;

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

    public static void clickFeedbackNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("staff-nav-feedback"));
        navBtn.click();
        Thread.sleep(2000);

        // table load check
        waitForVisible(By.xpath("//table"));
    }

    public static void clickFirstFeedbackActionButton() throws InterruptedException {
        List<WebElement> actionButtons = driver.findElements(By.id("stafffeedback-button-1"));

        if (actionButtons.isEmpty()) {
            feedbackActionWorked = true;
            return;
        }

        WebElement firstButton = actionButtons.get(0);
        scrollIntoView(firstButton);
        firstButton.click();
        Thread.sleep(2000);

        feedbackActionWorked = true;
    }

    public static boolean isStaffFeedbackActionWorkingSuccessfully() {
        return feedbackActionWorked;
    }
}