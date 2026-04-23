package Pages.Staffpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class StaffDashboard extends BrowserDriver {

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void clickDashboardNavigationButton() throws InterruptedException {
        WebElement dashboardNav = waitForClickable(By.id("staff-nav-dashboard"));
        dashboardNav.click();
        Thread.sleep(2000);

        waitForVisible(By.id("dashboardhome-button-1"));
    }

    public static void scrollDownDashboardPage() throws InterruptedException {
        JavascriptExecutor js = (JavascriptExecutor) driver;

        js.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        Thread.sleep(2000);
    }

    public static void scrollUpDashboardPage() throws InterruptedException {
        JavascriptExecutor js = (JavascriptExecutor) driver;

        js.executeScript("window.scrollTo(0, 0);");
        Thread.sleep(2000);
    }

    public static boolean isStaffDashboardScrollingWorkingSuccessfully() {
        try {
            JavascriptExecutor js = (JavascriptExecutor) driver;
            Long scrollPosition = (Long) js.executeScript("return window.pageYOffset;");
            return scrollPosition == 0;
        } catch (Exception e) {
            return false;
        }
    }
}