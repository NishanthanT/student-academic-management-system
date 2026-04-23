package Pages.Staffpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class Stafflogin extends BrowserDriver {

    public static String baseUrl = "http://localhost:5173/";

    public static void navigateToStaffLoginPageURL() throws InterruptedException {
        BrowserDriver.BrowserDriver();
        driver.get(baseUrl);
        driver.manage().window().maximize();
        Thread.sleep(2000);
    }

    public static void enterStaffEmailAndPassword() throws InterruptedException {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-email"))).clear();
        driver.findElement(By.id("login-email")).sendKeys("karankuru05@gmail.com");

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-password"))).clear();
        driver.findElement(By.id("login-password")).sendKeys("Thaya0506@");

        Thread.sleep(1000);
    }

    public static void clickStaffSignInButton() throws InterruptedException {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        wait.until(ExpectedConditions.elementToBeClickable(By.id("login-submit-btn"))).click();
        Thread.sleep(3000);
    }

    public static boolean isStaffDashboardLoaded() {
        try {
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
            wait.until(ExpectedConditions.or(
                    ExpectedConditions.urlContains("/staff"),
                    ExpectedConditions.urlContains("/dashboard")
            ));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}