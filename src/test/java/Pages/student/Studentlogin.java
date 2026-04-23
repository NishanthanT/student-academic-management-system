package Pages.Studentpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class Studentlogin extends BrowserDriver {

    public static String baseUrl = "http://localhost:5173/";

    public static void navigateToStudentLoginPageURL() throws InterruptedException {
        BrowserDriver.BrowserDriver();
        driver.get(baseUrl);
        driver.manage().window().maximize();
        Thread.sleep(2000);
    }

    public static void enterStudentEmailAndPassword() throws InterruptedException {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-email"))).clear();
        driver.findElement(By.id("login-email")).sendKeys("thayalannishanthan2001@gmail.com");

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-password"))).clear();
        driver.findElement(By.id("login-password")).sendKeys("Thaya0506@");

        Thread.sleep(1000);
    }

    public static void clickStudentSignInButton() throws InterruptedException {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        wait.until(ExpectedConditions.elementToBeClickable(By.id("login-submit-btn"))).click();
        Thread.sleep(3000);
    }

    public static boolean isStudentDashboardLoaded() {
        try {
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
            wait.until(ExpectedConditions.or(
                    ExpectedConditions.urlContains("/student"),
                    ExpectedConditions.urlContains("/dashboard")
            ));
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}