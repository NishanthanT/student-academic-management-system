package Pages.Studentpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class StudentDashboard extends BrowserDriver {

    public static long bottomScrollPosition = 0;
    public static long topScrollPosition = -1;

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static void navigatesToTheDashboardPage() throws InterruptedException {
        driver.get("http://localhost:5173/student");
        driver.manage().window().maximize();
        Thread.sleep(2000);

        waitForVisible(By.id("studentdashboard-button-2"));
    }

    public static void scrollDownTheDashboardPageFully() throws InterruptedException {
        JavascriptExecutor js = (JavascriptExecutor) driver;

        WebElement mainContainer = driver.findElement(By.xpath("//main[contains(@class,'overflow-y-auto')]"));

        js.executeScript("arguments[0].scrollTop = arguments[0].scrollHeight;", mainContainer);
        Thread.sleep(2500);

        Object value = js.executeScript("return arguments[0].scrollTop;", mainContainer);
        bottomScrollPosition = ((Number) value).longValue();
    }

    public static void scrollUpTheDashboardPageFully() throws InterruptedException {
        JavascriptExecutor js = (JavascriptExecutor) driver;

        WebElement mainContainer = driver.findElement(By.xpath("//main[contains(@class,'overflow-y-auto')]"));

        js.executeScript("arguments[0].scrollTop = 0;", mainContainer);
        Thread.sleep(2500);

        Object value = js.executeScript("return arguments[0].scrollTop;", mainContainer);
        topScrollPosition = ((Number) value).longValue();
    }

    public static boolean isStudentDashboardScrollingWorkingSuccessfully() {
        return bottomScrollPosition > 0 && topScrollPosition == 0;
    }
}